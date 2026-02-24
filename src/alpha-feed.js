/**
 * BLNK Alpha Feed API
 * Provides trending safe contracts to high-tier stakers only
 */

const { ethers } = require('ethers');

class AlphaFeed {
  constructor(config = {}) {
    this.contractAddress = config.contractAddress || process.env.PAYMENT_GATE_ADDRESS;
    this.rpcUrl = config.rpcUrl || process.env.BASE_RPC_URL;
    this.platinumThreshold = 100_000; // 100,000 BLNK for Platinum tier
    
    // ABI for tier checking
    this.abi = [
      'function stakedBalances(address user) view returns (uint256)',
      'function getTier(address user) view returns (string)'
    ];
    
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.abi,
      this.provider
    );
    
    // Database reference
    this.db = null;
    this.logger = null;
  }
  
  /**
   * Set database connection
   */
  setDatabase(db) {
    this.db = db;
  }
  
  /**
   * Set logger reference
   */
  setLogger(logger) {
    this.logger = logger;
  }
  
  /**
   * Express middleware: Check if user has Platinum tier (>= 100,000 BLNK)
   */
  requirePlatinumTier() {
    return async (req, res, next) => {
      try {
        // Get wallet address from API key or request
        const apiKey = req.headers['x-api-key'];
        const walletAddress = req.headers['x-wallet-address'] || req.body?.wallet;
        
        if (!walletAddress) {
          return res.status(401).json({
            error: 'Wallet address required',
            message: 'Please provide x-wallet-address header'
          });
        }
        
        // Check staked balance on blockchain
        const stakedBalance = await this.contract.stakedBalances(walletAddress);
        const stakedInTokens = parseFloat(ethers.formatEther(stakedBalance));
        
        // Check if meets Platinum threshold
        if (stakedInTokens < this.platinumThreshold) {
          return res.status(403).json({
            error: 'Insufficient $BLNK staked for Alpha access',
            message: `Platinum tier requires ${this.platinumThreshold.toLocaleString()} BLNK staked. You have ${stakedInTokens.toFixed(2)} BLNK.`,
            required: this.platinumThreshold,
            current: stakedInTokens,
            upgrade_url: '/api/v1/auth/upgrade'
          });
        }
        
        // Get tier name
        const tier = await this.contract.getTier(walletAddress);
        
        // Attach tier info to request
        req.userTier = {
          name: tier,
          staked: stakedInTokens,
          wallet: walletAddress
        };
        
        next();
        
      } catch (error) {
        console.error('Platinum tier check error:', error);
        return res.status(500).json({
          error: 'Tier verification failed',
          message: error.message
        });
      }
    };
  }
  
  /**
   * Alternative middleware: Check from local database (faster)
   */
  requirePlatinumTierDB() {
    return async (req, res, next) => {
      try {
        const walletAddress = req.headers['x-wallet-address'];
        
        if (!walletAddress) {
          return res.status(401).json({
            error: 'Wallet address required'
          });
        }
        
        if (!this.db) {
          return res.status(500).json({
            error: 'Database not available'
          });
        }
        
        // Query local database
        const userTier = await this.getUserTierFromDB(walletAddress);
        
        if (!userTier || userTier.tier !== 'PLATINUM') {
          return res.status(403).json({
            error: 'Insufficient $BLNK staked for Alpha access',
            message: 'Platinum tier required (100,000+ BLNK staked)',
            current_tier: userTier?.tier || 'NONE'
          });
        }
        
        req.userTier = userTier;
        next();
        
      } catch (error) {
        console.error('Platinum tier DB check error:', error);
        return res.status(500).json({
          error: 'Tier verification failed'
        });
      }
    };
  }
  
  /**
   * Get user tier from database
   */
  async getUserTierFromDB(walletAddress) {
    // In production: Query SQLite
    // Example:
    // const row = await this.db.get(
    //   'SELECT tier, staked_amount FROM user_tiers WHERE address = ?',
    //   [walletAddress]
    // );
    // return row;
    
    // For now: Return mock data
    return {
      address: walletAddress,
      tier: 'FREE',
      staked: 0
    };
  }
  
  /**
   * Get trending safe contracts
   */
  async getTrendingContracts(options = {}) {
    const { hours = 1, minRequests = 50 } = options;
    
    try {
      // Calculate time threshold
      const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
      
      // In production: Query logger database
      // Get contracts requested > 50 times in last hour with PASS decision
      
      // Mock data for demonstration
      const trendingContracts = [
        {
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          name: 'Wrapped ETH',
          symbol: 'WETH',
          requests: 156,
          passRate: 100,
          riskScore: 10,
          firstSeen: Date.now() - 3600000
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'USD Coin',
          symbol: 'USDC',
          requests: 234,
          passRate: 100,
          riskScore: 10,
          firstSeen: Date.now() - 7200000
        }
      ];
      
      // In production:
      // const contracts = await this.db.all(`
      //   SELECT token, COUNT(*) as requests,
      //          SUM(CASE WHEN verdict = 'PASS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pass_rate
      //   FROM request_logs
      //   WHERE timestamp > ? AND verdict = 'PASS'
      //   GROUP BY token
      //   HAVING requests >= ?
      //   ORDER BY requests DESC
      //   LIMIT 50
      // `, [timeThreshold, minRequests]);
      
      return trendingContracts;
      
    } catch (error) {
      console.error('Error getting trending contracts:', error);
      throw error;
    }
  }
  
  /**
   * Format contract data for API response
   */
  formatContractData(contracts) {
    return contracts.map(contract => ({
      address: contract.address,
      name: contract.name,
      symbol: contract.symbol,
      metrics: {
        requests_1h: contract.requests,
        pass_rate: contract.passRate,
        risk_score: contract.riskScore
      },
      first_seen: new Date(contract.firstSeen).toISOString(),
      alpha_score: this.calculateAlphaScore(contract)
    }));
  }
  
  /**
   * Calculate alpha score (0-100)
   */
  calculateAlphaScore(contract) {
    // Factors: request volume, pass rate, time since first seen
    const requestScore = Math.min(contract.requests / 200 * 40, 40); // Max 40 points
    const passRateScore = contract.passRate * 0.5; // Max 50 points
    const recencyScore = Math.max(10 - (Date.now() - contract.firstSeen) / 3600000, 0); // Max 10 points
    
    return Math.round(requestScore + passRateScore + recencyScore);
  }
  
  /**
   * Express route handler for GET /api/v1/alpha/trending
   */
  async handleGetTrending(req, res) {
    try {
      const { hours = 1, min_requests = 50 } = req.query;
      
      // Get trending contracts
      const contracts = await this.getTrendingContracts({
        hours: parseInt(hours),
        minRequests: parseInt(min_requests)
      });
      
      // Format response
      const formatted = this.formatContractData(contracts);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        user_tier: req.userTier,
        filters: {
          hours: parseInt(hours),
          min_requests: parseInt(min_requests)
        },
        count: formatted.length,
        contracts: formatted
      });
      
    } catch (error) {
      console.error('Alpha feed error:', error);
      res.status(500).json({
        error: 'Failed to fetch trending contracts',
        message: error.message
      });
    }
  }
}

module.exports = { AlphaFeed };
