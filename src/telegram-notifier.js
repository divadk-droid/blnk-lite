/**
 * BLNK Telegram Notifier
 * Sends alerts and reports to Telegram
 */

const https = require('https');

const CONFIG = {
  token: process.env.TELEGRAM_TOKEN || '8663677672:AAH3w7iB6vXkwWVsfyk9mAxh0v7rQpkEYhY',
  chatId: process.env.TELEGRAM_CHAT_ID || '564592509'
};

class TelegramNotifier {
  constructor() {
    this.token = CONFIG.token;
    this.chatId = CONFIG.chatId;
    this.baseUrl = 'https://api.telegram.org/bot' + this.token;
  }

  async sendMessage(text, options) {
    options = options || {};
    const url = this.baseUrl + '/sendMessage';
    
    // Convert actual newlines to \n for JSON
    const jsonText = text.replace(/\n/g, '\\n');
    
    const data = JSON.stringify({
      chat_id: this.chatId,
      text: jsonText,
      parse_mode: options.parseMode || 'HTML',
      disable_notification: options.silent || false
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
      req.write(data);
      req.end();
    });
  }

  async sendDailyReport(metrics) {
    const lines = [
      '📊 <b>BLNK Daily Report</b>',
      '',
      '📈 <b>Traffic</b>',
      '• Total Requests: ' + (metrics.totalRequests || 0),
      '• Avg Latency: ' + (metrics.avgLatency || 0) + 'ms',
      '• Cache Hit Rate: ' + ((metrics.cacheHitRate || 0).toFixed(1)) + '%',
      '',
      '🎯 <b>Verdicts</b>',
      '• ✅ PASS: ' + (metrics.pass || 0),
      '• ⚠️ WARN: ' + (metrics.warn || 0),
      '• 🚫 BLOCK: ' + (metrics.block || 0),
      '',
      '🕐 ' + new Date().toLocaleString()
    ];
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendAlert(level, message) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };
    
    const icon = icons[level] || '📢';
    const lines = [
      icon + ' <b>[' + level.toUpperCase() + ']</b>',
      '',
      message
    ];
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendImplementationComplete(task) {
    const lines = [
      '✅ <b>Auto-Implementation Complete</b>',
      '',
      'Task: ' + task,
      'Time: ' + new Date().toLocaleString(),
      '',
      'Next: Testing and validation'
    ];
    
    return this.sendMessage(lines.join('\n'));
  }

  async sendResearchSummary(ideas) {
    const lines = [
      '🔬 <b>Research Summary</b>',
      '',
      'Found ' + ideas.length + ' applicable ideas:'
    ];
    
    for (let i = 0; i < ideas.length; i++) {
      lines.push('• ' + ideas[i]);
    }
    
    lines.push('');
    lines.push('Added to PLAN.md');
    
    return this.sendMessage(lines.join('\n'));
  }
}

module.exports = { TelegramNotifier };

// Test if called directly
if (require.main === module) {
  const notifier = new TelegramNotifier();
  notifier.sendAlert('info', 'BLNK Telegram notifier is ready!');
}
