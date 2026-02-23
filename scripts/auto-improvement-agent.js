#!/usr/bin/env node
/**
 * BLNK Auto-Improvement Agent
 * Runs hourly tests and updates PLAN.md with improvements
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { TelegramNotifier } = require('../src/telegram-notifier');

const CONFIG = {
  apiUrl: 'https://blnk-lite-production.up.railway.app',
  planPath: path.join(__dirname, '..', 'PLAN.md'),
  progressPath: path.join(__dirname, '..', 'PROGRESS.md'),
  testInterval: 60 * 60 * 1000,
  alertThresholds: {
    latencyWarning: 1000,
    latencyCritical: 5000,
    errorRate: 0.05
  }
};

class AutoImprovementAgent {
  constructor() {
    this.issues = [];
    this.metrics = {
      totalTests: 0,
      failedTests: 0,
      latencies: []
    };
    this.notifier = new TelegramNotifier();
  }

  async run() {
    console.log(`[${new Date().toISOString()}] 🔍 Auto-Improvement Agent Starting...`);
    
    try {
      // Run all tests
      await this.testHealth();
      await this.testGate();
      await this.testPolicy();
      await this.testCache();
      await this.testRateLimit();
      
      // Analyze results
      this.analyzeResults();
      
      // Update PLAN.md if issues found
      if (this.issues.length > 0) {
        await this.updatePlanMd();
      }
      
      // Log progress
      await this.logProgress();
      
      console.log(`[${new Date().toISOString()}] ✅ Agent completed. Issues found: ${this.issues.length}`);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Agent error:`, error.message);
    }
  }

  async testHealth() {
    try {
      const start = Date.now();
      const response = await this.fetch('/health');
      const latency = Date.now() - start;
      
      this.metrics.latencies.push(latency);
      this.metrics.totalTests++;
      
      if (!response.ok) {
        this.metrics.failedTests++;
        this.issues.push({
          type: 'CRITICAL',
          category: 'health',
          message: 'Health check failed',
          detail: `Status: ${response.status}`,
          autoFix: false
        });
      } else if (latency > CONFIG.alertThresholds.latencyWarning) {
        this.issues.push({
          type: 'WARNING',
          category: 'performance',
          message: 'Health check latency high',
          detail: `${latency}ms`,
          autoFix: false
        });
      }
    } catch (error) {
      this.metrics.failedTests++;
      this.issues.push({
        type: 'CRITICAL',
        category: 'health',
        message: 'Health check error',
        detail: error.message,
        autoFix: false
      });
    }
  }

  async testGate() {
    const testTokens = [
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', expected: 'PASS' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', expected: 'PASS' }
    ];
    
    for (const token of testTokens) {
      try {
        const start = Date.now();
        const result = await this.fetch('/api/v1/gate', {
          method: 'POST',
          body: JSON.stringify({
            token: token.address,
            actionType: 'swap'
          })
        });
        const latency = Date.now() - start;
        
        this.metrics.latencies.push(latency);
        this.metrics.totalTests++;
        
        if (result.decision !== token.expected) {
          this.issues.push({
            type: 'WARNING',
            category: 'logic',
            message: `Gate decision mismatch for ${token.address}`,
            detail: `Expected: ${token.expected}, Got: ${result.decision}`,
            autoFix: false
          });
        }
        
        if (latency > 5000) {
          this.issues.push({
            type: 'WARNING',
            category: 'performance',
            message: 'Gate latency critical',
            detail: `${latency}ms for ${token.address}`,
            autoFix: true,
            suggestedFix: 'Run cache warmer'
          });
        }
      } catch (error) {
        this.metrics.failedTests++;
        this.issues.push({
          type: 'CRITICAL',
          category: 'api',
          message: 'Gate endpoint error',
          detail: error.message,
          autoFix: false
        });
      }
    }
  }

  async testPolicy() {
    try {
      const result = await this.fetch('/api/v1/policies');
      
      if (!result.policies || result.policies.length < 4) {
        this.issues.push({
          type: 'WARNING',
          category: 'data',
          message: 'Policy count lower than expected',
          detail: `Found: ${result.policies?.length || 0}, Expected: 4`,
          autoFix: false
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'WARNING',
        category: 'api',
        message: 'Policy endpoint error',
        detail: error.message,
        autoFix: false
      });
    }
  }

  async testCache() {
    // Test cache hit rate
    const token = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    
    try {
      // First call (may be miss)
      await this.fetch('/api/v1/gate', {
        method: 'POST',
        body: JSON.stringify({ token, actionType: 'swap' })
      });
      
      // Second call (should be hit)
      const start = Date.now();
      const result = await this.fetch('/api/v1/gate', {
        method: 'POST',
        body: JSON.stringify({ token, actionType: 'swap' })
      });
      const latency = Date.now() - start;
      
      if (!result.rpc_efficiency?.cached && latency > 100) {
        this.issues.push({
          type: 'WARNING',
          category: 'cache',
          message: 'Cache may not be working optimally',
          detail: `Second call latency: ${latency}ms, cached: ${result.rpc_efficiency?.cached}`,
          autoFix: true,
          suggestedFix: 'Check cache TTL and storage'
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'WARNING',
        category: 'cache',
        message: 'Cache test error',
        detail: error.message,
        autoFix: false
      });
    }
  }

  async testRateLimit() {
    // Test rate limit with unique wallet
    const wallet = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    try {
      const result = await this.fetch('/api/v1/gate', {
        method: 'POST',
        body: JSON.stringify({
          token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          actionType: 'swap',
          wallet
        })
      });
      
      if (!result.rate_limit || result.rate_limit.remaining < 99) {
        this.issues.push({
          type: 'INFO',
          category: 'rate_limit',
          message: 'Rate limit tracking check',
          detail: `Remaining: ${result.rate_limit?.remaining}`,
          autoFix: false
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'WARNING',
        category: 'rate_limit',
        message: 'Rate limit test error',
        detail: error.message,
        autoFix: false
      });
    }
  }

  async fetch(endpoint, options = {}) {
    const url = `${CONFIG.apiUrl}${endpoint}`;
    const opts = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    if (options.body) {
      opts.body = options.body;
    }
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, opts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ ...parsed, ok: res.statusCode < 400 });
          } catch {
            resolve({ ok: res.statusCode < 400, data });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
      req.end();
    });
  }

  analyzeResults() {
    const avgLatency = this.metrics.latencies.length > 0
      ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length
      : 0;
    
    const errorRate = this.metrics.totalTests > 0
      ? this.metrics.failedTests / this.metrics.totalTests
      : 0;
    
    if (errorRate > CONFIG.alertThresholds.errorRate) {
      this.issues.push({
        type: 'CRITICAL',
        category: 'reliability',
        message: 'Error rate above threshold',
        detail: `${(errorRate * 100).toFixed(2)}%`,
        autoFix: false
      });
    }
    
    this.metricsSummary = {
      avgLatency: Math.round(avgLatency),
      errorRate: errorRate.toFixed(4),
      totalTests: this.metrics.totalTests,
      failedTests: this.metrics.failedTests
    };
  }

  async updatePlanMd() {
    try {
      let content = fs.readFileSync(CONFIG.planPath, 'utf-8');
      
      // Add new issues to "검토 중 (Under Review)" section
      const newIssues = this.issues.filter(i => i.type !== 'INFO');
      
      if (newIssues.length > 0) {
        const issueSection = newIssues.map(issue => {
          const fixNote = issue.autoFix ? ` (자동 수정 가능: ${issue.suggestedFix})` : '';
          return `- [ ] **${issue.type}** [${issue.category}] ${issue.message}${fixNote}`;
        }).join('\n');
        
        // Check if section exists
        if (!content.includes('## 자동 감지 (Auto-Detected)')) {
          content += `\n\n## 자동 감지 (Auto-Detected)\n\n`;
        }
        
        // Add timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        content += `\n### ${timestamp}\n${issueSection}\n`;
        
        fs.writeFileSync(CONFIG.planPath, content);
        console.log(`[${new Date().toISOString()}] 📝 Updated PLAN.md with ${newIssues.length} issues`);
      }
    } catch (error) {
      console.error('Failed to update PLAN.md:', error.message);
    }
  }

  async logProgress() {
    try {
      let content = fs.readFileSync(CONFIG.progressPath, 'utf-8');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const time = new Date().toISOString().split('T')[1].split('.')[0];
      
      const logEntry = `\n#### ${time} - 자동 테스트\n` +
        `- **테스트 수행:** ${this.metrics.totalTests}개\n` +
        `- **실패:** ${this.metrics.failedTests}개\n` +
        `- **평균 지연:** ${this.metricsSummary?.avgLatency || 'N/A'}ms\n` +
        `- **에러율:** ${this.metricsSummary?.errorRate || 'N/A'}\n` +
        `- **발견 이슈:** ${this.issues.length}개\n`;
      
      // Insert after today's section
      const todayHeader = `## ${timestamp}`;
      if (content.includes(todayHeader)) {
        content = content.replace(
          new RegExp(`(${todayHeader}.*?)(?=## |$)`, 's'),
          `$1${logEntry}`
        );
      } else {
        content += `\n${todayHeader}\n${logEntry}`;
      }
      
      fs.writeFileSync(CONFIG.progressPath, content);
      console.log(`[${new Date().toISOString()}] 📝 Updated PROGRESS.md`);
    } catch (error) {
      console.error('Failed to update PROGRESS.md:', error.message);
    }
  }
}

// Run immediately if called directly
if (require.main === module) {
  const agent = new AutoImprovementAgent();
  agent.run();
}

module.exports = { AutoImprovementAgent };
