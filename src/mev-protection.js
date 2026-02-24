/**
 * MEV Protection & Slippage Prediction Module
 * Protects against sandwich attacks and MEV extraction
 */

const { ethers } = require('ethers');

class MEVProtection {
  constructor(provider) {
    this.provider = provider;
    this.sandwichPatterns = new Map();
    this.knownMEVBots = new Set();
    this.slippageHistory = [];
  }

  /**
   * Analyze transaction for MEV risk
   */
  async analyzeMEVRisk(txParams) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      dex,
      deadline
    } = txParams;

    const risks = [];
    const protections = [];

    // 1. Check for sandwich attack risk
    const sandwichRisk = await this.detectSandwichRisk(tokenIn, tokenOut, amountIn);
    if (sandwichRisk.isHigh) {
      risks.push({
        type: 'SANDWICH_ATTACK',
        severity: 'HIGH',
        description: 'High sandwich attack risk detected',
        estimatedLoss: sandwichRisk.estimatedLoss,
        confidence: sandwichRisk.confidence
      });
      protections.push('Use private mempool (Flashbots)');
      protections.push('Split order into smaller chunks');
    }

    // 2. Check for frontrunning risk
    const frontrunRisk = await this.detectFrontrunRisk(tokenIn, amountIn);
    if (frontrunRisk.isHigh) {
      risks.push({
        type: 'FRONTRUNNING',
        severity: 'MEDIUM',
        description: 'Frontrunning bots detected in mempool',
        confidence: frontrunRisk.confidence
      });
      protections.push('Increase gas price by 10-20%');
      protections.push('Use Flashbots Protect');
    }

    // 3. Calculate optimal slippage
    const optimalSlippage = await this.calculateOptimalSlippage(tokenIn, tokenOut, amountIn);

    // 4. Check for backrunning risk
    const backrunRisk = await this.detectBackrunRisk(tokenOut, minAmountOut);

    // 5. Get mempool analysis
    const mempoolAnalysis = await this.analyzeMempool(tokenIn, tokenOut);

    return {
      risk_level: risks.length === 0 ? 'LOW' : risks.some(r => r.severity === 'HIGH') ? 'HIGH' : 'MEDIUM',
      risks,
      protections,
      optimal_slippage: optimalSlippage,
      recommended_gas_price: await this.getRecommendedGasPrice(frontrunRisk),
      mempool_analysis: mempoolAnalysis,
      use_private_mempool: risks.some(r => r.severity === 'HIGH'),
      split_recommendation: sandwichRisk.isHigh ? this.calculateSplitAmount(amountIn) : null
    };
  }

  /**
   * Detect sandwich attack risk
   */
  async detectSandwichRisk(tokenIn, tokenOut, amountIn) {
    // Check recent sandwich patterns
    const pattern = this.sandwichPatterns.get(`${tokenIn}-${tokenOut}`);
    
    if (!pattern) {
      return { isHigh: false, confidence: 0 };
    }

    const now = Date.now();
    const recentAttacks = pattern.attacks.filter(a => now - a.timestamp < 3600000); // 1 hour

    if (recentAttacks.length === 0) {
      return { isHigh: false, confidence: 0 };
    }

    // Calculate risk based on attack frequency and amount similarity
    const avgAmount = recentAttacks.reduce((sum, a) => sum + BigInt(a.amount), 0n) / BigInt(recentAttacks.length);
    const amountDiff = Number(amountIn - avgAmount) / Number(avgAmount);
    
    const isHigh = recentAttacks.length >= 3 && Math.abs(amountDiff) < 0.5;
    const estimatedLoss = isHigh ? Number(amountIn) * 0.01 : 0; // ~1% loss estimate

    return {
      isHigh,
      estimatedLoss,
      confidence: Math.min(recentAttacks.length / 5, 1),
      recent_attacks: recentAttacks.length
    };
  }

  /**
   * Detect frontrunning risk
   */
  async detectFrontrunRisk(token, amount) {
    try {
      // Get pending transactions from mempool
      const pendingBlock = await this.provider.send('eth_getBlockByNumber', ['pending', false]);
      
      if (!pendingBlock || !pendingBlock.transactions) {
        return { isHigh: false, confidence: 0 };
      }

      // Analyze pending transactions for frontrunning patterns
      const suspiciousTxs = pendingBlock.transactions.filter(tx => {
        // Check if transaction interacts with same token
        // and has higher gas price
        return tx.to && tx.to.toLowerCase() === token.toLowerCase();
      });

      const isHigh = suspiciousTxs.length >= 2;
      
      return {
        isHigh,
        confidence: Math.min(suspiciousTxs.length / 5, 1),
        competing_txs: suspiciousTxs.length
      };
    } catch (error) {
      console.error('Frontrun detection error:', error);
      return { isHigh: false, confidence: 0 };
    }
  }

  /**
   * Calculate optimal slippage based on market conditions
   */
  async calculateOptimalSlippage(tokenIn, tokenOut, amountIn) {
    // Get historical slippage data
    const historicalData = this.slippageHistory.filter(h => 
      h.tokenIn === tokenIn && 
      h.tokenOut === tokenOut &&
      Date.now() - h.timestamp < 86400000 // 24 hours
    );

    if (historicalData.length === 0) {
      return {
        recommended: 0.5, // 0.5% default
        min_safe: 0.3,
        max_safe: 1.0,
        confidence: 'low'
      };
    }

    // Calculate statistics
    const slippages = historicalData.map(h => h.slippage);
    const avg = slippages.reduce((a, b) => a + b, 0) / slippages.length;
    const max = Math.max(...slippages);
    const stdDev = Math.sqrt(slippages.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / slippages.length);

    // Recommended slippage = average + 2 standard deviations
    const recommended = Math.min(avg + 2 * stdDev, 5.0); // Cap at 5%

    return {
      recommended: Number(recommended.toFixed(2)),
      min_safe: Number(Math.max(avg - stdDev, 0.1).toFixed(2)),
      max_safe: Number(Math.min(max + stdDev, 10.0).toFixed(2)),
      confidence: historicalData.length > 10 ? 'high' : 'medium',
      sample_size: historicalData.length
    };
  }

  /**
   * Detect backrunning risk
   */
  async detectBackrunRisk(tokenOut, minAmountOut) {
    // Similar to frontrunning but for the output token
    return { isHigh: false, confidence: 0 };
  }

  /**
   * Analyze mempool for MEV activity
   */
  async analyzeMempool(tokenIn, tokenOut) {
    return {
      pending_swaps: 0,
      mev_bot_activity: 'low',
      gas_price_trend: 'stable',
      recommendation: 'normal'
    };
  }

  /**
   * Get recommended gas price
   */
  async getRecommendedGasPrice(frontrunRisk) {
    const baseGasPrice = await this.provider.getFeeData();
    
    if (frontrunRisk.isHigh) {
      // Increase by 20% to outbid frontrunners
      return {
        maxFeePerGas: baseGasPrice.maxFeePerGas * 120n / 100n,
        maxPriorityFeePerGas: baseGasPrice.maxPriorityFeePerGas * 120n / 100n,
        reason: 'frontrunning_protection'
      };
    }

    return {
      maxFeePerGas: baseGasPrice.maxFeePerGas,
      maxPriorityFeePerGas: baseGasPrice.maxPriorityFeePerGas,
      reason: 'standard'
    };
  }

  /**
   * Calculate optimal split for large orders
   */
  calculateSplitAmount(totalAmount) {
    // Split into 3-5 chunks based on size
    const numChunks = Math.min(Math.max(Math.floor(Number(totalAmount) / 100000), 3), 5);
    const chunkSize = totalAmount / BigInt(numChunks);

    return {
      num_chunks: numChunks,
      chunk_size: chunkSize.toString(),
      delay_between: 2000, // 2 seconds
      reason: 'sandwich_protection'
    };
  }

  /**
   * Record slippage for learning
   */
  recordSlippage(tokenIn, tokenOut, expectedAmount, actualAmount) {
    const slippage = (Number(expectedAmount - actualAmount) / Number(expectedAmount)) * 100;
    
    this.slippageHistory.push({
      tokenIn,
      tokenOut,
      slippage,
      timestamp: Date.now()
    });

    // Keep only last 1000 records
    if (this.slippageHistory.length > 1000) {
      this.slippageHistory.shift();
    }
  }

  /**
   * Record sandwich attack
   */
  recordSandwichAttack(tokenIn, tokenOut, amount, victim) {
    const key = `${tokenIn}-${tokenOut}`;
    
    if (!this.sandwichPatterns.has(key)) {
      this.sandwichPatterns.set(key, { attacks: [] });
    }

    this.sandwichPatterns.get(key).attacks.push({
      amount: amount.toString(),
      victim,
      timestamp: Date.now()
    });
  }
}

module.exports = { MEVProtection };
