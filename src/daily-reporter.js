/**
 * BLNK Daily Report Automation
 * Sends daily metrics to Telegram/Discord
 */

const https = require('https');

class DailyReporter {
  constructor(logger, config = {}) {
    this.logger = logger;
    this.telegramToken = config.telegramToken;
    this.telegramChatId = config.telegramChatId;
    this.discordWebhook = config.discordWebhook;
  }

  async generateAndSend() {
    const report = this.logger.generateDailyReport();
    
    if (report.error) {
      console.log('Daily report:', report.error);
      return;
    }

    const message = this.formatTelegramMessage(report);
    
    if (this.telegramToken && this.telegramChatId) {
      await this.sendTelegram(message);
    }
    
    if (this.discordWebhook) {
      await this.sendDiscord(report);
    }
    
    console.log('✅ Daily report sent');
    return report;
  }

  formatTelegramMessage(report) {
    const revenue = this.estimateRevenue(report);
    
    return `📊 *BLNK Daily Report* - ${report.date}

📈 *Traffic*
• Total Requests: ${report.total_requests.toLocaleString()}
• Avg Latency: ${report.avg_latency_ms}ms
• Cache Hit Rate: ${(report.cache_hit_rate * 100).toFixed(1)}%

🎯 *Verdicts*
• ✅ PASS: ${report.verdicts.PASS || 0}
• ⚠️ WARN: ${report.verdicts.WARN || 0}
• 🚫 BLOCK: ${report.verdicts.BLOCK || 0}

💰 *Estimated Revenue*: $${revenue}

🔥 *Top Tokens* (Today)
${report.top_tokens.slice(0, 5).map(([token, count], i) => `${i + 1}. \`${token.slice(0, 12)}...\`: ${count} calls`).join('\n')}

⛓️ *Top Chains*
${report.top_chains.map(([chain, count]) => `• ${chain}: ${count}`).join('\n')}

#BLNK #DailyReport`;
  }

  estimateRevenue(report) {
    // Rough estimate: $0.01 per call average
    return (report.total_requests * 0.01).toFixed(2);
  }

  async sendTelegram(message) {
    const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
    const data = JSON.stringify({
      chat_id: this.telegramChatId,
      text: message,
      parse_mode: 'Markdown'
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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

  async sendDiscord(report) {
    const embed = {
      title: `📊 BLNK Daily Report - ${report.date}`,
      color: 0x00ff00,
      fields: [
        {
          name: '📈 Traffic',
          value: `Requests: ${report.total_requests.toLocaleString()}\nAvg Latency: ${report.avg_latency_ms}ms\nCache Hit: ${(report.cache_hit_rate * 100).toFixed(1)}%`,
          inline: true
        },
        {
          name: '🎯 Verdicts',
          value: `✅ PASS: ${report.verdicts.PASS || 0}\n⚠️ WARN: ${report.verdicts.WARN || 0}\n🚫 BLOCK: ${report.verdicts.BLOCK || 0}`,
          inline: true
        },
        {
          name: '💰 Est. Revenue',
          value: `$${this.estimateRevenue(report)}`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    const data = JSON.stringify({ embeds: [embed] });

    return new Promise((resolve, reject) => {
      const req = https.request(this.discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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
}

module.exports = { DailyReporter };
