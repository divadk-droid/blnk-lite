const express = require('express');
const { LiteAnalyzer } = require('./lite-analyzer');
const { SQLiteCache } = require('./sqlite-cache');
const { RiskSchema, ExecutionGate } = require('./schema');
const { Logger } = require('./logger');

const app = express();
app.use(express.json());

// Initialize
const analyzer = new LiteAnalyzer();
const cache = new SQLiteCache();
const logger = new Logger();
let cacheReady = false;

// Initialize cache on startup
(async () => {
  try {
    await cache.init();
    cacheReady = true;
    console.log('✅ SQLite cache initialized');
  } catch (err) {
    console.error('⚠️  Cache init failed, running without cache:', err.message);
  }
})();

// Version endpoint
app.get('/version', (req, res) => {
  res.json({
    service: 'blnk-lite',
    version: '1.0.0',
    schema_version: '1.0.0',
    engine_version: '1.0.0',
    mode: 'LITE',
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check
app.get('/health', async (req, res) => {
  const cacheStats = cacheReady ? await cache.getStats() : { status: 'no-cache' };
  res.json({
    ok: true,
    status: 'healthy',
    mode: 'LITE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache: cacheStats,
    analyzer: analyzer.getStats()
  });
});

// Lite execution_pre_trade_gate
app.post('/api/v1/gate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { token, actionType, amount = '0', chain = 'ethereum' } = req.body;
    
    // Validation
    if (!token || !/^0x[a-fA-F0-9]{40}$/i.test(token)) {
      return res.status(400).json({
        decision: 'BLOCK',
        reason: 'Invalid token address'
      });
    }
    
    // Check cache (if available)
    const cacheKey = `gate:${chain}:${token.toLowerCase()}`;
    let result = null;
    
    if (cacheReady) {
      result = await cache.get(cacheKey);
    }
    
    if (!result) {
      // Lite analysis - only 1 RPC call
      const analysis = await analyzer.gateCheck(token);
      
      // Convert to unified schema
      const riskSchema = RiskSchema.create({
        riskScore: analysis.riskScore,
        confidence: analysis.confidence,
        signals: Object.entries(analysis.checks)
          .filter(([_, v]) => v === true)
          .map(([type]) => ({
            type: type.toUpperCase(),
            severity: type === 'mintable' || type === 'suspicious' ? 'critical' : 'medium'
          })),
        metadata: {
          liteMode: true,
          rpcCalls: analysis.rpcCalls
        }
      });
      
      // Gate decision
      const gate = ExecutionGate.evaluate(riskSchema);
      
      // Determine recommended next call based on verdict
      let recommendedNextCall = null;
      if (gate.decision === 'WARN') {
        recommendedNextCall = {
          skill: 'validation_token_safety_scan',
          reason: 'WARN decision - deep scan recommended for final confirmation',
          estimated_time: '5-15 min',
          price: '$5 USD',
          upsell_value: 'Complete risk analysis before execution'
        };
      } else if (gate.decision === 'PASS' && riskSchema.risk_score > 30) {
        recommendedNextCall = {
          skill: 'monitoring_tier_pro',
          reason: 'Medium risk detected - consider ongoing monitoring',
          estimated_time: '7-day subscription',
          price: '$79 USD/month',
          upsell_value: 'Continuous risk monitoring with alerts'
        };
      }

      result = {
        schema_version: '1.0.0',
        gate_id: gate.gate_id,
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - startTime + analysis.latencyMs,
        mode: 'LITE',
        ...gate,
        recommended_next_call: recommendedNextCall,
        token,
        actionType,
        rpc_efficiency: {
          calls: analysis.rpcCalls,
          cached: false
        }
      };
      
      // Cache for 5 minutes
      if (cacheReady) {
        await cache.set(cacheKey, result, 300);
      }
    } else {
      result.latency_ms = Date.now() - startTime;
      result.rpc_efficiency = { calls: 0, cached: true };
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Gate error:', error);
    res.status(500).json({
      decision: 'BLOCK',
      reason: 'System error',
      error: error.message
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const report = logger.generateDailyReport();
  const cacheStats = cacheReady ? await cache.getStats() : { status: 'unavailable' };
  
  res.json({
    mode: 'LITE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    daily_report: report,
    cache: cacheStats,
    analyzer: analyzer.getStats()
  });
});

// Cleanup expired cache entries every hour
setInterval(async () => {
  if (cacheReady) {
    await cache.cleanup();
  }
}, 3600000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛡️  BLNK LITE running on port ${PORT}`);
  console.log(`📊 Mode: Free tier (1 RPC call per gate check)`);
  console.log(`💾 Cache: SQLite (file-based)`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/v1/gate    - Pre-trade gate (1 RPC call)`);
  console.log(`  GET  /health         - Health check`);
  console.log(`  GET  /stats          - Statistics`);
});

module.exports = app;
