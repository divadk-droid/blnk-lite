/**
 * BLNK Event-Driven Monitoring Engine
 * Phase 2: Transform monitoring into recurring infrastructure
 */

const EventEmitter = require('events');

class MonitoringEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.watchlists = new Map();
    this.eventProcessors = new Map();
    this.alertHistory = new Map();
    this.config = {
      dedupWindowMs: config.dedupWindowMs || 3600000, // 1 hour
      fatigueThreshold: config.fatigueThreshold || 5, // alerts per hour
      severityLevels: {
        INFO: 1,
        LOW: 2,
        MEDIUM: 3,
        HIGH: 4,
        CRITICAL: 5
      },
      ...config
    };
    
    this.initializeProcessors();
  }

  initializeProcessors() {
    // Event processors for different trigger types
    this.eventProcessors.set('LIQUIDITY_DELTA', this.processLiquidityDelta.bind(this));
    this.eventProcessors.set('OWNERSHIP_CHANGE', this.processOwnershipChange.bind(this));
    this.eventProcessors.set('CONTRACT_UPGRADE', this.processContractUpgrade.bind(this));
    this.eventProcessors.set('BRIDGE_EXPOSURE', this.processBridgeExposure.bind(this));
    this.eventProcessors.set('PRICE_VOLATILITY', this.processPriceVolatility.bind(this));
  }

  // Add token to watchlist
  async addToWatchlist(userId, token, options = {}) {
    const watchId = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const watchConfig = {
      id: watchId,
      userId,
      token,
      chain: options.chain || 'ethereum',
      triggers: options.triggers || ['LIQUIDITY_DELTA', 'OWNERSHIP_CHANGE'],
      thresholds: {
        liquidityDelta: options.liquidityThreshold || 20, // %
        priceVolatility: options.volatilityThreshold || 10, // %
        ...options.thresholds
      },
      channels: options.channels || ['webhook'],
      createdAt: new Date().toISOString(),
      lastCheck: null,
      alertCount: 0
    };

    this.watchlists.set(watchId, watchConfig);
    
    // Start monitoring loop
    this.startMonitoring(watchId);
    
    return watchConfig;
  }

  // Start monitoring loop for a watch
  async startMonitoring(watchId) {
    const watch = this.watchlists.get(watchId);
    if (!watch) return;

    // Initial check
    await this.checkToken(watch);
    
    // Schedule next check based on tier
    const interval = this.getCheckInterval(watch.userId);
    
    setTimeout(() => {
      if (this.watchlists.has(watchId)) {
        this.startMonitoring(watchId);
      }
    }, interval);
  }

  getCheckInterval(userId) {
    // Tier-based check frequency
    const tiers = {
      free: 3600000,      // 1 hour
      pro: 900000,        // 15 minutes
      enterprise: 300000  // 5 minutes
    };
    
    // Would lookup user tier from database
    return tiers.pro;
  }

  // Main check function
  async checkToken(watch) {
    try {
      const events = [];
      
      // Check each trigger type
      for (const triggerType of watch.triggers) {
        const processor = this.eventProcessors.get(triggerType);
        if (processor) {
          const event = await processor(watch);
          if (event) events.push(event);
        }
      }

      // Process detected events
      for (const event of events) {
        await this.processEvent(watch, event);
      }

      watch.lastCheck = new Date().toISOString();
      
    } catch (error) {
      console.error(`Monitoring check failed for ${watch.token}:`, error);
    }
  }

  // Event processors
  async processLiquidityDelta(watch) {
    // Simulate liquidity check
    const delta = Math.random() * 100 - 30; // -30% to +70%
    
    if (Math.abs(delta) > watch.thresholds.liquidityDelta) {
      return {
        type: 'LIQUIDITY_DELTA',
        severity: delta < -50 ? 'CRITICAL' : delta < -20 ? 'HIGH' : 'MEDIUM',
        data: {
          token: watch.token,
          delta: `${delta.toFixed(2)}%`,
          previousTVL: '1000000',
          currentTVL: (1000000 * (1 + delta/100)).toFixed(0)
        },
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  async processOwnershipChange(watch) {
    // Simulate ownership check
    if (Math.random() > 0.95) { // 5% chance
      return {
        type: 'OWNERSHIP_CHANGE',
        severity: 'HIGH',
        data: {
          token: watch.token,
          action: 'transferOwnership',
          newOwner: '0x...',
          oldOwner: '0x...'
        },
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  async processContractUpgrade(watch) {
    // Check for proxy upgrades
    return null; // Placeholder
  }

  async processBridgeExposure(watch) {
    // Check bridge exposure
    return null; // Placeholder
  }

  async processPriceVolatility(watch) {
    const volatility = Math.random() * 20;
    
    if (volatility > watch.thresholds.priceVolatility) {
      return {
        type: 'PRICE_VOLATILITY',
        severity: volatility > 30 ? 'CRITICAL' : 'HIGH',
        data: {
          token: watch.token,
          volatility: `${volatility.toFixed(2)}%`,
          timeWindow: '1h'
        },
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  // Process detected event
  async processEvent(watch, event) {
    // Check deduplication
    if (this.isDuplicate(watch, event)) {
      return;
    }

    // Check fatigue
    if (this.isFatigued(watch)) {
      console.log(`Alert fatigue detected for ${watch.userId}, suppressing`);
      return;
    }

    // Score severity
    const severityScore = this.config.severityLevels[event.severity] || 1;
    
    // Create alert
    const alert = {
      id: `alert_${Date.now()}`,
      watchId: watch.id,
      userId: watch.userId,
      token: watch.token,
      event,
      severityScore,
      channels: watch.channels,
      createdAt: new Date().toISOString(),
      dispatched: false
    };

    // Store alert
    this.storeAlert(alert);

    // Dispatch
    await this.dispatchAlert(alert, watch);

    // Emit for external handlers
    this.emit('alert', alert);
  }

  isDuplicate(watch, event) {
    const key = `${watch.token}-${event.type}-${event.data?.delta || event.data?.action}`;
    const lastAlert = this.alertHistory.get(key);
    
    if (lastAlert) {
      const age = Date.now() - new Date(lastAlert).getTime();
      if (age < this.config.dedupWindowMs) {
        return true;
      }
    }
    
    this.alertHistory.set(key, new Date().toISOString());
    return false;
  }

  isFatigued(watch) {
    const recentAlerts = Array.from(this.alertHistory.values())
      .filter(time => {
        const age = Date.now() - new Date(time).getTime();
        return age < 3600000; // 1 hour
      });
    
    return recentAlerts.length > this.config.fatigueThreshold;
  }

  storeAlert(alert) {
    // Would store in database
    console.log(`Alert stored: ${alert.id}`);
  }

  async dispatchAlert(alert, watch) {
    for (const channel of watch.channels) {
      try {
        await this.sendToChannel(channel, alert);
        alert.dispatched = true;
      } catch (error) {
        console.error(`Failed to dispatch to ${channel}:`, error);
      }
    }
  }

  async sendToChannel(channel, alert) {
    switch (channel) {
      case 'webhook':
        // Would POST to webhook URL
        console.log(`Webhook dispatch: ${alert.id}`);
        break;
      case 'telegram':
        // Would send Telegram message
        console.log(`Telegram dispatch: ${alert.id}`);
        break;
      case 'discord':
        // Would send Discord webhook
        console.log(`Discord dispatch: ${alert.id}`);
        break;
      default:
        console.log(`Unknown channel: ${channel}`);
    }
  }

  // Get user's watchlist
  getUserWatchlist(userId) {
    return Array.from(this.watchlists.values())
      .filter(w => w.userId === userId);
  }

  // Remove from watchlist
  removeFromWatchlist(watchId) {
    return this.watchlists.delete(watchId);
  }
}

module.exports = { MonitoringEngine };
