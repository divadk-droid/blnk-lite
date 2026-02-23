const express = require('express');
const { LiteAnalyzer } = require('./lite-analyzer');
const { SQLiteCache } = require('./sqlite-cache');
const { RiskSchema, ExecutionGate } = require('./schema');

const app = express();
app.use(express.json());

// Initialize Lite Mode
const analyzer = new LiteAnalyzer();
const cache = new SQLiteCache();
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

// Health check
app.get('/health', async (req, res) => {
  const stats = cacheReady ? await cache.getStats() : { status: 'no-cache' };
  res.json({
    mode: 'LITE',
    status: 'healthy',
    cache: stats,
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
      
      result = {
        schema_version: '1.0.0',
        gate_id: gate.gate_id,
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - startTime + analysis.latencyMs,
        mode: 'LITE',
        ...gate,
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

// Stats endpoint
app.get('/stats', async (req, res) => {
  const cacheStats = cacheReady ? await cache.getStats() : { status: 'unavailable' };
  res.json({
    mode: 'LITE',
    version: '1.0.0',
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
