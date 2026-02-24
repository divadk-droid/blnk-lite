/**
 * BLNK Payment Listener
 * Listens to on-chain events and updates off-chain state
 */

const { ethers } = require('ethers');
const EventEmitter = require('events');

class PaymentListener extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Configuration
    this.rpcUrl = config.rpcUrl || process.env.BASE_RPC_URL || 'https://base.llamarpc.com';
    this.wsUrl = config.wsUrl || process.env.BASE_WS_URL;
    this.contractAddress = config.contractAddress || process.env.PAYMENT_GATE_ADDRESS;
    this.privateKey = config.privateKey || process.env.LISTENER_PRIVATE_KEY;
    
    // ABI for BlnkPaymentGate
    this.abi = [
      'event Staked(address indexed user, uint256 amount, string tier)',
      'event Unstaked(address indexed user, uint256 amount)',
      'event ApiPaid(address indexed client, uint256 amount, uint256 burned, uint256 treasuryAmount)',
      'event CreditsAdded(address indexed client, uint256 credits)',
      'function getTier(address user) view returns (string)',
      'function getTierDetails(address user) view returns (string tierName, uint256 dailyLimit)',
      'function getCredits(address user) view returns (uint256)',
      'function stakedBalances(address user) view returns (uint256)'
    ];
    
    // State
    this.provider = null;
    this.wsProvider = null;
    this.contract = null;
    this.wsContract = null;
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    
    // Database reference (injected)
    this.db = null;
  }
  
  /**
   * Set database connection
   */
  setDatabase(db) {
    this.db = db;
  }
  
  /**
   * Start listening to events
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Payment listener already running');
      return;
    }
    
    console.log('🎧 Starting BLNK Payment Listener...');
    console.log(`   Contract: ${this.contractAddress}`);
    console.log(`   RPC: ${this.rpcUrl}`);
    
    try {
      // Initialize providers
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Initialize contract
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.abi,
        this.provider
      );
      
      // Start WebSocket listener if URL provided
      if (this.wsUrl) {
        await this.startWebSocketListener();
      } else {
        // Fallback to polling
        await this.startPollingListener();
      }
      
      this.isRunning = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Payment listener started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start payment listener:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Start WebSocket event listener
   */
  async startWebSocketListener() {
    console.log('🔌 Connecting via WebSocket...');
    
    try {
      this.wsProvider = new ethers.WebSocketProvider(this.wsUrl);
      
      this.wsContract = new ethers.Contract(
        this.contractAddress,
        this.abi,
        this.wsProvider
      );
      
      // Set up event listeners
      this.wsContract.on('Staked', this.handleStaked.bind(this));
      this.wsContract.on('Unstaked', this.handleUnstaked.bind(this));
      this.wsContract.on('ApiPaid', this.handleApiPaid.bind(this));
      
      // Handle connection events
      this.wsProvider.on('error', this.handleError.bind(this));
      this.wsProvider.on('close', this.handleDisconnect.bind(this));
      
      console.log('✅ WebSocket listener connected');
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      throw error;
    }
  }
  
  /**
   * Start polling-based listener (fallback)
   */
  async startPollingListener() {
    console.log('🔄 Starting polling listener (WebSocket unavailable)...');
    
    // Poll for events every 30 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        // In production: Query for recent events
        // For now: Just check connection
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`📊 Polled block: ${blockNumber}`);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000);
    
    console.log('✅ Polling listener started (30s interval)');
  }
  
  /**
   * Handle Staked event
   */
  async handleStaked(user, amount, tier, event) {
    console.log(`🎯 Staked event: ${user} staked ${ethers.formatEther(amount)} BLNK, tier: ${tier}`);
    
    try {
      // Get tier details
      const tierDetails = await this.contract.getTierDetails(user);
      const dailyLimit = tierDetails[1];
      
      // Update database
      if (this.db) {
        await this.updateUserTier(user, tier, dailyLimit);
      }
      
      // Emit event for other modules
      this.emit('staked', {
        user,
        amount: amount.toString(),
        tier,
        dailyLimit: dailyLimit.toString(),
        txHash: event.log.transactionHash
      });
      
    } catch (error) {
      console.error('Error handling Staked event:', error);
    }
  }
  
  /**
   * Handle Unstaked event
   */
  async handleUnstaked(user, amount, event) {
    console.log(`🎯 Unstaked event: ${user} unstaked ${ethers.formatEther(amount)} BLNK`);
    
    try {
      // Get new tier
      const tier = await this.contract.getTier(user);
      const tierDetails = await this.contract.getTierDetails(user);
      const dailyLimit = tierDetails[1];
      
      // Update database
      if (this.db) {
        await this.updateUserTier(user, tier, dailyLimit);
      }
      
      this.emit('unstaked', {
        user,
        amount: amount.toString(),
        tier,
        dailyLimit: dailyLimit.toString(),
        txHash: event.log.transactionHash
      });
      
    } catch (error) {
      console.error('Error handling Unstaked event:', error);
    }
  }
  
  /**
   * Handle ApiPaid event
   */
  async handleApiPaid(client, amount, burned, treasuryAmount, event) {
    const amountEth = ethers.formatEther(amount);
    const burnedEth = ethers.formatEther(burned);
    const treasuryEth = ethers.formatEther(treasuryAmount);
    
    console.log(`💰 ApiPaid event: ${client} paid ${amountEth} BLNK`);
    console.log(`   Burned: ${burnedEth}, Treasury: ${treasuryEth}`);
    
    try {
      // Calculate credits (1 BLNK = 100 calls)
      const credits = Math.floor(parseFloat(amountEth) * 100);
      
      // Update database
      if (this.db) {
        await this.addApiCredits(client, credits);
      }
      
      this.emit('apiPaid', {
        client,
        amount: amount.toString(),
        burned: burned.toString(),
        treasuryAmount: treasuryAmount.toString(),
        credits,
        txHash: event.log.transactionHash
      });
      
    } catch (error) {
      console.error('Error handling ApiPaid event:', error);
    }
  }
  
  /**
   * Update user tier in database
   */
  async updateUserTier(user, tier, dailyLimit) {
    if (!this.db) return;
    
    try {
      // In production: Update SQLite database
      // For now: Log the update
      console.log(`📝 DB Update: User ${user} -> Tier: ${tier}, Daily Limit: ${dailyLimit}`);
      
      // Example SQL (implement based on your DB schema):
      // await this.db.run(
      //   'INSERT OR REPLACE INTO user_tiers (address, tier, daily_limit, updated_at) VALUES (?, ?, ?, ?)',
      //   [user, tier, dailyLimit, Date.now()]
      // );
      
    } catch (error) {
      console.error('Error updating user tier:', error);
    }
  }
  
  /**
   * Add API credits to user
   */
  async addApiCredits(client, credits) {
    if (!this.db) return;
    
    try {
      console.log(`📝 DB Update: Client ${client} +> ${credits} credits`);
      
      // Example SQL:
      // await this.db.run(
      //   'UPDATE user_credits SET credits = credits + ? WHERE address = ?',
      //   [credits, client]
      // );
      
    } catch (error) {
      console.error('Error adding API credits:', error);
    }
  }
  
  /**
   * Handle connection errors
   */
  handleError(error) {
    console.error('❌ Payment listener error:', error);
    
    if (this.isRunning) {
      this.handleDisconnect();
    }
  }
  
  /**
   * Handle disconnection with exponential backoff
   */
  async handleDisconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Giving up.');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }
  
  /**
   * Stop listening
   */
  async stop() {
    console.log('🛑 Stopping payment listener...');
    
    this.isRunning = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    if (this.wsProvider) {
      await this.wsProvider.destroy();
    }
    
    console.log('✅ Payment listener stopped');
  }
  
  /**
   * Get listener status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts,
      contractAddress: this.contractAddress,
      rpcUrl: this.rpcUrl,
      wsConnected: !!this.wsProvider
    };
  }
}

module.exports = { PaymentListener };
