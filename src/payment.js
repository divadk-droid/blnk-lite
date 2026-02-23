/**
 * BLNK Payment Infrastructure
 * Stripe integration + API Key management
 */

const crypto = require('crypto');

class PaymentManager {
  constructor() {
    // In-memory store (upgrade to database in production)
    this.apiKeys = new Map();
    this.subscriptions = new Map();
    
    // Stripe integration placeholder
    this.stripeEnabled = false;
  }

  // Generate API key for tier
  generateApiKey(wallet, tier = 'FREE') {
    const key = `blnk_${crypto.randomBytes(16).toString('hex')}`;
    
    this.apiKeys.set(key, {
      wallet,
      tier,
      createdAt: Date.now(),
      active: true
    });
    
    return key;
  }

  // Validate API key and get tier
  validateKey(apiKey) {
    if (!apiKey || !this.apiKeys.has(apiKey)) {
      return { valid: false, tier: 'FREE' };
    }
    
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData.active) {
      return { valid: false, tier: 'FREE' };
    }
    
    return { valid: true, tier: keyData.tier, wallet: keyData.wallet };
  }

  // Upgrade tier (after Stripe payment)
  async upgradeTier(apiKey, newTier, stripeSubscriptionId) {
    if (!this.apiKeys.has(apiKey)) {
      throw new Error('Invalid API key');
    }
    
    const keyData = this.apiKeys.get(apiKey);
    keyData.tier = newTier;
    keyData.upgradedAt = Date.now();
    
    this.subscriptions.set(apiKey, {
      stripeId: stripeSubscriptionId,
      tier: newTier,
      status: 'active',
      startedAt: Date.now()
    });
    
    return { success: true, tier: newTier };
  }

  // Cancel subscription
  async cancelSubscription(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (keyData) {
      keyData.tier = 'FREE';
      keyData.cancelledAt = Date.now();
    }
    
    const sub = this.subscriptions.get(apiKey);
    if (sub) {
      sub.status = 'cancelled';
      sub.cancelledAt = Date.now();
    }
    
    return { success: true };
  }

  // Get subscription info
  getSubscription(apiKey) {
    return this.subscriptions.get(apiKey) || null;
  }

  // Stripe webhook handler (placeholder)
  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'invoice.paid':
        // Subscription renewed
        console.log('Subscription paid:', event.data.object);
        break;
        
      case 'invoice.payment_failed':
        // Payment failed - downgrade to FREE
        console.log('Payment failed:', event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        // Subscription cancelled
        console.log('Subscription cancelled:', event.data.object);
        break;
    }
    
    return { received: true };
  }
}

module.exports = { PaymentManager };

  // Auto-generate API key with email verification
  async generateKeyWithVerification(email, wallet) {
    // TODO: Send verification email
    // TODO: Create pending key
    // TODO: Activate after verification
    return this.generateApiKey(wallet, 'FREE');
  }
