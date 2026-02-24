/**
 * BLNK Token-Based Tier System
 * Replaces USDC subscription with BLNK staking
 */

class TokenTierManager {
  constructor() {
    // Tier definitions (BLNK staking amounts)
    this.tiers = {
      FREE: {
        minStake: 0,
        dailyCalls: 5,
        features: ['Basic gate']
      },
      BRONZE: {
        minStake: 1000, // 1,000 BLNK
        dailyCalls: 100,
        features: ['Basic gate', 'Standard support']
      },
      SILVER: {
        minStake: 10000, // 10,000 BLNK
        dailyCalls: 500,
        features: ['Priority gate', 'Policy pack', 'Email support']
      },
      GOLD: {
        minStake: 100000, // 100,000 BLNK
        dailyCalls: 1000,
        features: ['Fast lane', 'All validations', 'Discord support']
      },
      PLATINUM: {
        minStake: 1000000, // 1,000,000 BLNK
        dailyCalls: 10000,
        features: ['Dedicated RPC', 'Custom policies', 'Priority support', 'Governance']
      }
    };
    
    // User staking data (in production: read from blockchain)
    this.userStakes = new Map();
  }
  
  /**
   * Get user's tier based on staked amount
   */
  getUserTier(wallet) {
    const stake = this.userStakes.get(wallet) || { amount: 0 };
    
    // Check tiers from highest to lowest
    if (stake.amount >= this.tiers.PLATINUM.minStake) return 'PLATINUM';
    if (stake.amount >= this.tiers.GOLD.minStake) return 'GOLD';
    if (stake.amount >= this.tiers.SILVER.minStake) return 'SILVER';
    if (stake.amount >= this.tiers.BRONZE.minStake) return 'BRONZE';
    return 'FREE';
  }
  
  /**
   * Get tier details
   */
  getTierDetails(tierName) {
    return this.tiers[tierName] || this.tiers.FREE;
  }
  
  /**
   * Update user's staked amount (called from blockchain events)
   */
  updateStake(wallet, amount) {
    this.userStakes.set(wallet, {
      amount,
      updatedAt: Date.now()
    });
    
    return this.getUserTier(wallet);
  }
  
  /**
   * Calculate burn amount per call (alternative to staking)
   */
  calculateBurnAmount(tier) {
    const burnRates = {
      FREE: 100,      // 100 BLNK per call
      BRONZE: 100,    // 100 BLNK per call
      SILVER: 80,     // 80 BLNK per call (20% discount)
      GOLD: 50,       // 50 BLNK per call (50% discount)
      PLATINUM: 0     // Free for Platinum
    };
    
    return burnRates[tier] || 100;
  }
  
  /**
   * Get all tiers for frontend display
   */
  getAllTiers() {
    return Object.entries(this.tiers).map(([name, config]) => ({
      name,
      minStake: config.minStake,
      dailyCalls: config.dailyCalls,
      features: config.features,
      burnRate: this.calculateBurnAmount(name)
    }));
  }
  
  /**
   * Check if user can make a call
   */
  canMakeCall(wallet, tier) {
    const tierConfig = this.getTierDetails(tier);
    return tierConfig.dailyCalls > 0;
  }
}

module.exports = { TokenTierManager };
