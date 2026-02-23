/**
 * Stripe Integration
 * Subscription management for BLNK tiers
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeIntegration {
  constructor() {
    this.prices = {
      basic: process.env.STRIPE_PRICE_BASIC,
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE
    };
  }

  async createCustomer(wallet, email) {
    return await stripe.customers.create({
      metadata: { wallet }
    });
  }

  async createSubscription(customerId, tier) {
    const priceId = this.prices[tier.toLowerCase()];
    if (!priceId) throw new Error('Invalid tier');
    
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { tier }
    });
  }

  async handleWebhook(event) {
    switch (event.type) {
      case 'invoice.paid':
        await this.activateSubscription(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.deactivateSubscription(event.data.object);
        break;
    }
  }

  async activateSubscription(invoice) {
    // Update API key tier
    console.log('Subscription activated:', invoice.subscription);
  }

  async deactivateSubscription(invoice) {
    // Downgrade to FREE
    console.log('Subscription deactivated:', invoice.subscription);
  }
}

module.exports = { StripeIntegration };
