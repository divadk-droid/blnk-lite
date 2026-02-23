/**
 * BLNK Logging System
 * Request tracking for evolution and metrics
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.ensureLogDir();
    
    // Daily log rotation
    this.currentDate = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `requests-${this.currentDate}.jsonl`);
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logRequest(data) {
    const logEntry = {
      request_id: data.requestId || this.generateRequestId(),
      timestamp: new Date().toISOString(),
      endpoint: data.endpoint,
      chain: data.chain || 'ethereum',
      token: data.token,
      action_type: data.actionType,
      verdict: data.verdict,
      latency_ms: data.latencyMs,
      cache_hit: data.cacheHit || false,
      error_code: data.errorCode || null,
      risk_score: data.riskScore,
      confidence: data.confidence,
      rpc_calls: data.rpcCalls || 0
    };

    // Append to daily log file
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    
    return logEntry.request_id;
  }

  // Daily metrics report
  generateDailyReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `requests-${dateStr}.jsonl`);

    if (!fs.existsSync(logFile)) {
      return { error: 'No log file for yesterday' };
    }

    const logs = fs.readFileSync(logFile, 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    const report = {
      date: dateStr,
      total_requests: logs.length,
      endpoints: {},
      verdicts: { PASS: 0, WARN: 0, BLOCK: 0, UNKNOWN: 0 },
      avg_latency_ms: 0,
      cache_hit_rate: 0,
      top_tokens: {},
      top_chains: {}
    };

    let totalLatency = 0;
    let cacheHits = 0;

    logs.forEach(log => {
      // Endpoints
      report.endpoints[log.endpoint] = (report.endpoints[log.endpoint] || 0) + 1;
      
      // Verdicts
      report.verdicts[log.verdict] = (report.verdicts[log.verdict] || 0) + 1;
      
      // Latency
      totalLatency += log.latency_ms;
      
      // Cache
      if (log.cache_hit) cacheHits++;
      
      // Top tokens
      report.top_tokens[log.token] = (report.top_tokens[log.token] || 0) + 1;
      
      // Top chains
      report.top_chains[log.chain] = (report.top_chains[log.chain] || 0) + 1;
    });

    report.avg_latency_ms = logs.length > 0 ? Math.round(totalLatency / logs.length) : 0;
    report.cache_hit_rate = logs.length > 0 ? (cacheHits / logs.length).toFixed(2) : 0;

    // Sort top tokens/chains
    report.top_tokens = Object.entries(report.top_tokens)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    report.top_chains = Object.entries(report.top_chains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return report;
  }
}

module.exports = { Logger };
