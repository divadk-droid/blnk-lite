const express = require('express');
const { LiteAnalyzer } = require('./lite-analyzer');
const { SQLiteCache } = require('./sqlite-cache');
const { RiskSchema, ExecutionGate } = require('./schema');
const { Logger } = require('./logger');
const { RateLimiter } = require('./rate-limiter');
const { PaymentManager } = require('./payment');
const { I18n } = require('./i18n');

const app = express();
app.use(express.json());

// Initialize
const analyzer = new LiteAnalyzer();
const cache = new SQLiteCache();
const logger = new Logger();
const rateLimiter = new RateLimiter();
const paymentManager = new PaymentManager();
const i18n = new I18n();
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
  const requestId = logger.generateRequestId();
  
  try {
    const { token, actionType, amount = '0', chain = 'ethereum', wallet = 'anonymous' } = req.body;
    
    // API Key validation
    const apiKey = req.headers['x-api-key'];
    const keyData = paymentManager.validateKey(apiKey);
    const effectiveTier = keyData.valid ? keyData.tier : 'FREE';
    
    // Rate limit check with tier
    const rateLimit = await rateLimiter.checkLimit(wallet, effectiveTier);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        decision: 'BLOCK',
        reason: 'Rate limit exceeded',
        rate_limit: rateLimit,
        upgrade: rateLimit.upgrade,
        get_api_key: 'POST /api/v1/auth/register'
      });
    }
    
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
        is_whitelisted: analysis.isWhitelisted || false,
        recommended_next_call: recommendedNextCall,
        rate_limit: {
          tier: rateLimit.tier,
          used: rateLimit.used,
          limit: rateLimit.limit,
          remaining: rateLimit.remaining
        },
        token,
        actionType,
        rpc_efficiency: {
          calls: analysis.rpcCalls,
          cached: false
        }
      };
      
      // Log the request
      logger.logRequest({
        requestId,
        endpoint: '/api/v1/gate',
        chain,
        token,
        actionType,
        verdict: gate.decision,
        latencyMs: result.latency_ms,
        cacheHit: false,
        riskScore: riskSchema.risk_score,
        confidence: riskSchema.confidence,
        rpcCalls: analysis.rpcCalls
      });
      
      // Cache for 15 minutes (gate) or 3 hours (scan)
      const ttl = cacheKey.includes('gate') ? 900 : 10800;
      
      if (cacheReady) {
        await cache.set(cacheKey, result, ttl);
      }
    } else {
      result.latency_ms = Date.now() - startTime;
      result.rpc_efficiency = { calls: 0, cached: true };
      
      // Log cached request
      logger.logRequest({
        requestId,
        endpoint: '/api/v1/gate',
        chain,
        token,
        actionType,
        verdict: result.decision,
        latencyMs: result.latency_ms,
        cacheHit: true,
        riskScore: result.risk_score,
        confidence: result.confidence,
        rpcCalls: 0
      });
    }
    
    // Apply i18n if requested
    const lang = i18n.detectLanguage(req);
    if (lang !== 'en') {
      result = i18n.translateResponse(result, lang);
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

// Alpha Feed API endpoints
const { AlphaFeed } = require('./alpha-feed');
const alphaFeed = new AlphaFeed();

// Apply middleware and route
app.get('/api/v1/alpha/trending', 
  alphaFeed.requirePlatinumTier.bind(alphaFeed)(),
  alphaFeed.handleGetTrending.bind(alphaFeed)
);

// Treasury system endpoints
const { TreasurySystem } = require('./treasury-system');
const treasury = new TreasurySystem();

// Schedule auto-execution (daily)
treasury.scheduleAutoExecution(24);

// Get treasury stats
app.get('/api/v1/treasury/stats', (req, res) => {
  res.json({
    stats: treasury.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Record revenue (webhook from payment system)
app.post('/api/v1/treasury/revenue', (req, res) => {
  try {
    const { amount, source, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }
    
    const record = treasury.recordRevenue(amount, source, metadata);
    
    res.json({
      success: true,
      record,
      pendingRevenue: treasury.revenue.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute manual distribution
app.post('/api/v1/treasury/execute', async (req, res) => {
  try {
    const result = await treasury.executeDistribution();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get burn history
app.get('/api/v1/treasury/burns', (req, res) => {
  const { limit = 100 } = req.query;
  res.json({
    burns: treasury.getBurnHistory(parseInt(limit)),
    total: treasury.burns.total
  });
});

// Get revenue history
app.get('/api/v1/treasury/revenue-history', (req, res) => {
  const { limit = 100 } = req.query;
  res.json({
    revenue: treasury.getRevenueHistory(parseInt(limit))
  });
});

// Report generation endpoints
const { ReportGenerator } = require('./report-generator');
const reportGenerator = new ReportGenerator();

// Generate PDF report
app.post('/api/v1/reports/pdf', async (req, res) => {
  try {
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Report data required' });
    }
    
    const report = await reportGenerator.generatePDF(data, options);
    
    res.json({
      success: true,
      report: {
        id: report.reportId,
        format: 'PDF',
        downloadUrl: report.downloadUrl,
        generatedAt: report.generatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Excel report
app.post('/api/v1/reports/excel', async (req, res) => {
  try {
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Report data required' });
    }
    
    const report = await reportGenerator.generateExcel(data, options);
    
    res.json({
      success: true,
      report: {
        id: report.reportId,
        format: 'Excel',
        downloadUrl: report.downloadUrl,
        generatedAt: report.generatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate portfolio report
app.post('/api/v1/reports/portfolio', async (req, res) => {
  try {
    const { tokens, format = 'pdf' } = req.body;
    
    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Tokens array required' });
    }
    
    const report = await reportGenerator.generatePortfolioReport(
      { tokens },
      { format }
    );
    
    res.json({
      success: true,
      report: {
        id: report.reportId,
        format: format.toUpperCase(),
        downloadUrl: report.downloadUrl,
        generatedAt: report.generatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List reports
app.get('/api/v1/reports', (req, res) => {
  const reports = reportGenerator.listReports();
  res.json({ reports });
});

// i18n endpoints
app.get('/api/v1/i18n/languages', (req, res) => {
  res.json({
    languages: i18n.getSupportedLanguages(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/i18n/translate', (req, res) => {
  const { key, lang } = req.body;
  const translation = i18n.t(key, lang);
  
  res.json({
    key,
    lang: lang || 'en',
    translation
  });
});

// Custom Risk Scoring endpoints
const { CustomRiskEngine } = require('./custom-risk-engine');
const customRiskEngine = new CustomRiskEngine();

// List risk model templates
app.get('/api/v1/risk/models', (req, res) => {
  res.json({
    templates: customRiskEngine.getTemplates(),
    timestamp: new Date().toISOString()
  });
});

// Create custom risk model
app.post('/api/v1/risk/models', async (req, res) => {
  try {
    const { name, description, factors, thresholds } = req.body;
    const wallet = req.headers['x-wallet-address'] || 'anonymous';
    
    const model = customRiskEngine.createModel(wallet, {
      name,
      description,
      factors,
      thresholds
    });
    
    res.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        description: model.description,
        factors: model.factors,
        thresholds: model.thresholds,
        createdAt: model.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate risk with custom model
app.post('/api/v1/risk/calculate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { token, modelId, analysis } = req.body;
    
    if (!token || !analysis) {
      return res.status(400).json({ error: 'Token and analysis data required' });
    }
    
    // Calculate custom risk score
    const result = customRiskEngine.calculateScore(analysis, modelId);
    
    res.json({
      schema_version: '1.0.0',
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - startTime,
      token,
      ...result
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare multiple models
app.post('/api/v1/risk/compare', async (req, res) => {
  try {
    const { analysis, modelIds } = req.body;
    
    if (!analysis || !Array.isArray(modelIds)) {
      return res.status(400).json({ error: 'Analysis and modelIds array required' });
    }
    
    const comparison = customRiskEngine.compareModels(analysis, modelIds);
    
    res.json({
      timestamp: new Date().toISOString(),
      comparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Policy Pack endpoints
const { PolicyPack } = require('./policy-pack');
const policyPack = new PolicyPack();

// List policies
app.get('/api/v1/policies', (req, res) => {
  res.json({
    policies: policyPack.listPolicies(),
    timestamp: new Date().toISOString()
  });
});

// Policy check
app.post('/api/v1/policy/check', async (req, res) => {
  try {
    const { token, policyId = 'moderate', tokenData = {} } = req.body;
    
    if (!token || !/^0x[a-fA-F0-9]{40}$/i.test(token)) {
      return res.status(400).json({
        verdict: 'BLOCK',
        reason: 'Invalid token address'
      });
    }
    
    const result = policyPack.evaluate(token, policyId, tokenData);
    
    // Log the request
    logger.logRequest({
      endpoint: '/api/v1/policy/check',
      token,
      verdict: result.verdict,
      latencyMs: 0,
      cacheHit: false,
      rpcCalls: 0
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Policy check error:', error);
    res.status(500).json({
      verdict: 'BLOCK',
      reason: 'System error'
    });
  }
});

// API Key management endpoints
app.post('/api/v1/auth/register', (req, res) => {
  const { wallet, tier = 'FREE' } = req.body;
  
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return res.status(400).json({ error: 'Valid wallet address required' });
  }
  
  const apiKey = paymentManager.generateApiKey(wallet, tier);
  
  res.json({
    api_key: apiKey,
    tier,
    wallet,
    message: 'Keep this key safe. It cannot be recovered.',
    upgrade_url: tier === 'FREE' ? 'https://stripe.com/blnk-upgrade' : null
  });
});

app.get('/api/v1/auth/me', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const keyData = paymentManager.validateKey(apiKey);
  
  if (!keyData.valid) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  const subscription = paymentManager.getSubscription(apiKey);
  
  res.json({
    tier: keyData.tier,
    wallet: keyData.wallet,
    subscription: subscription || null,
    rate_limits: rateLimiter.tiers[keyData.tier]
  });
});

// WebSocket stats endpoint
app.get('/api/v1/websocket/stats', (req, res) => {
  res.json({
    stats: wsAlerts.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Trigger test alert (for testing)
app.post('/api/v1/websocket/test-alert', (req, res) => {
  const { token } = req.body;
  wsAlerts.triggerTestAlert(token);
  res.json({
    success: true,
    message: 'Test alert triggered',
    token: token || 'default'
  });
});

// Stripe webhook (placeholder)
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = JSON.parse(req.body);
  await paymentManager.handleStripeWebhook(event);
  res.json({ received: true });
});
setInterval(async () => {
  if (cacheReady) {
    await cache.cleanup();
  }
  // Cleanup rate limiter
  rateLimiter.cleanup();
}, 3600000);

// Daily report cron (9 AM UTC)
const { DailyReporter } = require('./daily-reporter');
const reporter = new DailyReporter(logger, {
  // Add your Telegram/Discord credentials here
  // telegramToken: process.env.TELEGRAM_TOKEN,
  // telegramChatId: process.env.TELEGRAM_CHAT_ID,
  // discordWebhook: process.env.DISCORD_WEBHOOK
});

// Schedule daily report
setInterval(() => {
  const now = new Date();
  if (now.getUTCHours() === 9 && now.getUTCMinutes() === 0) {
    reporter.generateAndSend();
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🛡️  BLNK LITE running on port ${PORT}`);
  console.log(`📊 Mode: Free tier (1 RPC call per gate check)`);
  console.log(`💾 Cache: SQLite (file-based)`);
  console.log(`🎯 Rate Limiting: 4 tiers (FREE/BASIC/PRO/ENTERPRISE)`);
  console.log(`📈 Daily Reports: Auto-scheduled`);
  console.log(`🔌 WebSocket: Real-time alerts enabled`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/v1/gate           - Pre-trade gate (1 RPC call)`);
  console.log(`  POST /api/v1/policy/check   - Policy compliance check`);
  console.log(`  GET  /api/v1/policies       - List available policies`);
  console.log(`  GET  /health                - Health check`);
  console.log(`  GET  /version               - Version info`);
  console.log(`  GET  /metrics               - Daily metrics`);
  console.log(`  WS   /ws                    - WebSocket real-time alerts`);
});

// Initialize WebSocket server
const { WebSocketAlertSystem } = require('./websocket-alerts');
const wsAlerts = new WebSocketAlertSystem(server);

// Export for use in other modules
module.exports = { app, server, wsAlerts };

module.exports = app;
