/**
 * BLNK Rate Limiter + Token Utility
 * Tier-based access control for revenue
 */

class RateLimiter {
  constructor() {
    // In-memory store (Redis upgrade path ready)
    this.usage = new Map(); // key: tier_wallet -> { calls, resetTime }
    
    // Tier configuration
    this.tiers = {
      FREE: {
        name: 'Free',
        dailyCalls: 100,
        priority: 0,
        price: 0
      },
      BASIC: {
        name: 'Basic',
        dailyCalls: 500,
        priority: 1,
        price: 19,
        tokenRequirement: 100 // $BLNK tokens
      },
      PRO: {
        name: 'Pro',
        dailyCalls: 2000,
        priority: 2,
        price: 99,
        tokenRequirement: 500
      },
      ENTERPRISE: {
        name: 'Enterprise',
        dailyCalls: 10000,
        priority: 3,
        price: 499,
        tokenRequirement: 2500
      }
    };
  }

  // Determine tier from wallet/token holdings
  async getTier(wallet, tokenBalance = 0) {
    // In production: check on-chain token balance
    // For now: simulate based on header or default to FREE
    
    if (tokenBalance >= 2500) return 'ENTERPRISE';
    if (tokenBalance >= 500) return 'PRO';
    if (tokenBalance >= 100) return 'BASIC';
    return 'FREE';
  }

  // Check rate limit
  async checkLimit(wallet, tier = 'FREE') {
    const now = Date.now();
    const key = `${tier}_${wallet}`;
    const limit = this.tiers[tier].dailyCalls;
    
    let usage = this.usage.get(key);
    
    // Reset if new day
    if (!usage || now > usage.resetTime) {
      usage = {
        calls: 0,
        resetTime: now + 24 * 60 * 60 * 1000 // 24 hours
      };
    }
    
    const allowed = usage.calls < limit;
    
    if (allowed) {
      usage.calls++;
      this.usage.set(key, usage);
    }
    
    return {
      allowed,
      tier,
      used: usage.calls,
      limit,
      remaining: Math.max(0, limit - usage.calls),
      resetTime: usage.resetTime,
      upgrade: !allowed ? this.getUpgradeSuggestion(tier) : null
    };
  }

  getUpgradeSuggestion(currentTier) {
    const tiers = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const currentIdx = tiers.indexOf(currentTier);
    
    if (currentIdx < tiers.length - 1) {
      const nextTier = tiers[currentIdx + 1];
      const tier = this.tiers[nextTier];
      
      return {
        tier: nextTier,
        name: tier.name,
        dailyCalls: tier.dailyCalls,
        price: tier.price,
        tokenRequirement: tier.tokenRequirement,
        message: `Upgrade to ${tier.name} for ${tier.dailyCalls} calls/day (${tier.price} USD or ${tier.tokenRequirement} $BLNK)`
      };
    }
    
    return null;
  }

  // Get tier info for response
  getTierInfo(tier) {
    return this.tiers[tier] || this.tiers.FREE;
  }

  // Cleanup old entries (call periodically)
  cleanup() {
    const now = Date.now();
    for (const [key, usage] of this.usage.entries()) {
      if (now > usage.resetTime) {
        this.usage.delete(key);
      }
    }
  }
}

module.exports = { RateLimiter };
