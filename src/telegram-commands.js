/**
 * BLNK Telegram Command Handler
 * Execute commands via Telegram messages
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  token: process.env.TELEGRAM_TOKEN || '8663677672:AAH3w7iB6vXkwWVsfyk9mAxh0v7rQpkEYhY',
  chatId: process.env.TELEGRAM_CHAT_ID || '564592509',
  repoPath: '/root/.openclaw/workspace/blnk-backend'
};

class TelegramCommandHandler {
  constructor() {
    this.token = CONFIG.token;
    this.chatId = CONFIG.chatId;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
    this.lastUpdateId = 0;
    
    // Available commands
    this.commands = {
      '/status': this.cmdStatus.bind(this),
      '/health': this.cmdHealth.bind(this),
      '/metrics': this.cmdMetrics.bind(this),
      '/test': this.cmdTest.bind(this),
      '/deploy': this.cmdDeploy.bind(this),
      '/logs': this.cmdLogs.bind(this),
      '/plan': this.cmdPlan.bind(this),
      '/progress': this.cmdProgress.bind(this),
      '/help': this.cmdHelp.bind(this)
    };
  }

  async start() {
    console.log('[' + new Date().toISOString() + '] Telegram Command Handler started');
    await this.sendMessage('🤖 BLNK Command Bot is ready!\n\nType /help for available commands.');
    
    // Poll for messages every 5 seconds
    setInterval(() => this.pollMessages(), 5000);
  }

  async pollMessages() {
    try {
      const updates = await this.getUpdates();
      
      for (const update of updates) {
        if (update.update_id > this.lastUpdateId) {
          this.lastUpdateId = update.update_id;
          
          if (update.message && update.message.text) {
            await this.handleMessage(update.message.text, update.message.from);
          }
        }
      }
    } catch (error) {
      console.error('Poll error:', error.message);
    }
  }

  async getUpdates() {
    const url = `${this.baseUrl}/getUpdates?offset=${this.lastUpdateId + 1}`;
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.result || []);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async handleMessage(text, from) {
    const command = text.split(' ')[0];
    
    if (this.commands[command]) {
      console.log(`Executing command: ${command} from ${from.first_name}`);
      await this.commands[command](text);
    } else if (text.startsWith('/')) {
      await this.sendMessage('❓ Unknown command. Type /help for available commands.');
    }
  }

  // Command implementations
  async cmdStatus() {
    try {
      const status = execSync('cd ' + CONFIG.repoPath + ' && git status --short', { encoding: 'utf-8' });
      const message = status.trim() 
        ? '📝 Uncommitted changes:\n' + status
        : '✅ Working directory clean';
      await this.sendMessage(message);
    } catch (error) {
      await this.sendMessage('❌ Error: ' + error.message);
    }
  }

  async cmdHealth() {
    try {
      const response = await fetch('https://blnk-lite-production.up.railway.app/health');
      const data = await response.json();
      const message = `🩺 Health Status\n\n` +
        `Status: ${data.status}\n` +
        `Uptime: ${Math.floor(data.uptime / 60)}m\n` +
        `Version: ${data.version}`;
      await this.sendMessage(message);
    } catch (error) {
      await this.sendMessage('❌ Health check failed: ' + error.message);
    }
  }

  async cmdMetrics() {
    try {
      const response = await fetch('https://blnk-lite-production.up.railway.app/metrics');
      const data = await response.json();
      const message = `📊 Metrics\n\n` +
        `Cache entries: ${data.cache?.totalEntries || 0}\n` +
        `Hit rate: ${data.cache?.hitRate || 0}%`;
      await this.sendMessage(message);
    } catch (error) {
      await this.sendMessage('❌ Metrics failed: ' + error.message);
    }
  }

  async cmdTest() {
    await this.sendMessage('🧪 Running tests...');
    try {
      execSync('cd ' + CONFIG.repoPath + ' && npm test', { encoding: 'utf-8' });
      await this.sendMessage('✅ All tests passed!');
    } catch (error) {
      await this.sendMessage('❌ Tests failed:\n' + error.message);
    }
  }

  async cmdDeploy() {
    await this.sendMessage('🚀 Starting deployment...');
    try {
      execSync('cd ' + CONFIG.repoPath + ' && git push origin main', { encoding: 'utf-8' });
      await this.sendMessage('✅ Deployment complete!');
    } catch (error) {
      await this.sendMessage('❌ Deploy failed:\n' + error.message);
    }
  }

  async cmdLogs() {
    try {
      const logs = execSync('cd ' + CONFIG.repoPath + ' && tail -20 PROGRESS.md', { encoding: 'utf-8' });
      await this.sendMessage('📝 Recent logs:\n' + logs);
    } catch (error) {
      await this.sendMessage('❌ Error: ' + error.message);
    }
  }

  async cmdPlan() {
    try {
      const plan = fs.readFileSync(path.join(CONFIG.repoPath, 'PLAN.md'), 'utf-8');
      const pending = plan.split('\n').filter(l => l.includes('- [ ]')).slice(0, 10);
      const message = '📋 Top 10 pending items:\n\n' + pending.join('\n');
      await this.sendMessage(message);
    } catch (error) {
      await this.sendMessage('❌ Error: ' + error.message);
    }
  }

  async cmdProgress() {
    try {
      const progress = fs.readFileSync(path.join(CONFIG.repoPath, 'PROGRESS.md'), 'utf-8');
      const today = new Date().toISOString().split('T')[0];
      const lines = progress.split('\n');
      let todaySection = [];
      let inToday = false;
      
      for (const line of lines) {
        if (line.includes('## ' + today)) inToday = true;
        if (inToday && line.startsWith('## ') && !line.includes(today)) break;
        if (inToday) todaySection.push(line);
      }
      
      const message = todaySection.length > 0 
        ? '📈 Today\'s progress:\n' + todaySection.slice(0, 20).join('\n')
        : '📈 No progress logged today';
      await this.sendMessage(message);
    } catch (error) {
      await this.sendMessage('❌ Error: ' + error.message);
    }
  }

  async cmdHelp() {
    const message = `🤖 Available Commands\n\n` +
      `/status - Git status\n` +
      `/health - Server health\n` +
      `/metrics - Performance metrics\n` +
      `/test - Run test suite\n` +
      `/deploy - Deploy to production\n` +
      `/logs - Recent progress logs\n` +
      `/plan - View pending tasks\n` +
      `/progress - Today\'s progress\n` +
      `/help - Show this help`;
    await this.sendMessage(message);
  }

  async sendMessage(text) {
    const url = `${this.baseUrl}/sendMessage`;
    const data = JSON.stringify({
      chat_id: this.chatId,
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
}

// Helper for fetch
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ json: () => Promise.resolve(JSON.parse(data)) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

module.exports = { TelegramCommandHandler };

// Start if called directly
if (require.main === module) {
  new TelegramCommandHandler().start();
}
