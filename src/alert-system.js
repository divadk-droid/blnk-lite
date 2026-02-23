/**
 * BLNK Alert System
 * Monitors latency and errors
 */

const https = require('https');

class AlertSystem {
  constructor(config = {}) {
    this.thresholds = {
      latencyWarning: config.latencyWarning || 1000,  // 1s
      latencyCritical: config.latencyCritical || 5000, // 5s
      errorRate: config.errorRate || 0.05,             // 5%
      uptimeThreshold: config.uptimeThreshold || 0.99  // 99%
    };
    
    this.telegramToken = config.telegramToken;
    this.telegramChatId = config.telegramChatId;
    this.discordWebhook = config.discordWebhook;
    
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      slowRequests: 0,
      latencies: []
    };
  }

  async checkHealth() {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://blnk-lite-production.up.railway.app/health');
      const latency = Date.now() - startTime;
      
      this.metrics.totalRequests++;
      this.metrics.latencies.push(latency);
      
      // Keep last 100 latencies
      if (this.metrics.latencies.length > 100) {
        this.metrics.latencies.shift();
      }
      
      if (!response.ok) {
        this.metrics.failedRequests++;
        await this.sendAlert('CRITICAL', `Health check failed: ${response.status}`);
        return false;
      }
      
      if (latency > this.thresholds.latencyCritical) {
        this.metrics.slowRequests++;
        await this.sendAlert('CRITICAL', `Latency critical: ${latency}ms`);
      } else if (latency > this.thresholds.latencyWarning) {
        this.metrics.slowRequests++;
        await this.sendAlert('WARNING', `Latency high: ${latency}ms`);
      }
      
      return true;
      
    } catch (error) {
      this.metrics.totalRequests++;
      this.metrics.failedRequests++;
      await this.sendAlert('CRITICAL', `Health check error: ${error.message}`);
      return false;
    }
  }

  async sendAlert(level, message) {
    const timestamp = new Date().toISOString();
    const alertText = `🚨 [${level}] BLNK Alert\n\n${message}\n\nTime: ${timestamp}`;
    
    console.log(alertText);
    
    // Send to Telegram if configured
    if (this.telegramToken && this.telegramChatId) {
      await this.sendTelegram(alertText);
    }
    
    // Send to Discord if configured
    if (this.discordWebhook) {
      await this.sendDiscord(level, message);
    }
  }

  async sendTelegram(text) {
    const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
    const data = JSON.stringify({
      chat_id: this.telegramChatId,
      text: text,
      parse_mode: 'HTML'
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async sendDiscord(level, message) {
    const colors = {
      WARNING: 0xffaa00,
      CRITICAL: 0xff0000
    };

    const embed = {
      title: `🚨 BLNK ${level} Alert`,
      description: message,
      color: colors[level] || 0x999999,
      timestamp: new Date().toISOString()
    };

    const data = JSON.stringify({ embeds: [embed] });

    return new Promise((resolve, reject) => {
      const req = https.request(this.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  getMetrics() {
    const avgLatency = this.metrics.latencies.length > 0 
      ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length 
      : 0;
    
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;
    
    return {
      ...this.metrics,
      averageLatency: Math.round(avgLatency),
      errorRate: errorRate.toFixed(4),
      p95Latency: this.getPercentile(95)
    };
  }

  getPercentile(p) {
    if (this.metrics.latencies.length === 0) return 0;
    const sorted = [...this.metrics.latencies].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  startMonitoring(intervalMs = 60000) {
    console.log(`🔍 Starting monitoring (interval: ${intervalMs}ms)`);
    
    // Initial check
    this.checkHealth();
    
    // Periodic checks
    setInterval(() => this.checkHealth(), intervalMs);
    
    // Metrics report every 5 minutes
    setInterval(() => {
      const metrics = this.getMetrics();
      console.log('📊 Metrics:', metrics);
    }, 300000);
  }
}

module.exports = { AlertSystem };

// Run if called directly
if (require.main === module) {
  const alerts = new AlertSystem();
  alerts.startMonitoring();
}
