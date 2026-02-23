const express = require('express');
const { ContractAnalyzer } = require('./analyzer');
const { MemoryCache } = require('./cache');
const { RiskSchema, ExecutionGate } = require('./schema');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize
const analyzer = new ContractAnalyzer(process.env.ALCHEMY_ETHEREUM_KEY || 'https://eth.llamarpc.com');
const cache = new MemoryCache(); // Use Redis in production

// execution_pre_trade_gate endpoint
app.post('/api/v1/gate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { token, actionType, amount = '0', chain = 'ethereum', slippage = 0.5 } = req.body;
    
    // Validation
    if (!token || !/^0x[a-fA-F0-9]{40}$/i.test(token)) {
      return res.status(400).json({
        error: 'Invalid token address',
        decision: 'BLOCK'
      });
    }
    
    const validActions = ['swap', 'dca', 'yield_enter', 'lend', 'stake'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({
        error: `Invalid actionType. Must be: ${validActions.join(', ')}`,
        decision: 'BLOCK'
      });
    }
    
    // Check cache
    const cached = await cache.getGateResult(token, chain);
    if (cached) {
      cached.latency_ms = Date.now() - startTime;
      cached.cache.hit = true;
      return res.json(cached);
    }
    
    // Analyze contract
    const analysis = await analyzer.analyze(token);
    
    if (analysis.error) {
      return res.status(400).json({
        error: analysis.error,
        decision: 'BLOCK',
        timestamp: new Date().toISOString()
      });
    }

    // Convert to unified risk schema
    const riskSchema = RiskSchema.create({
      riskScore: analysis.riskScore,
      confidence: 0.85,
      signals: Object.entries(analysis.checks)
        .filter(([_, check]) => check.detected)
        .map(([type, check]) => ({
          type: type.toUpperCase(),
          severity: check.riskScore > 20 ? 'high' : 'medium',
          description: `${type} pattern detected`,
          evidenceRefs: check.matches || []
        })),
      evidence: [{
        id: `ev_${Date.now()}`,
        type: 'bytecode_analysis',
        source: 'onchain_rpc',
        timestamp: new Date().toISOString(),
        data: { codeHash: analysis.codeHash }
      }],
      metadata: {
        calibrationVersion: 'v1.0.0',
        engineVersion: 'v1.0.0'
      }
    });

    // Execute gate decision
    const gateDecision = ExecutionGate.evaluate(riskSchema, {
      maxRiskScore: 70,
      blockLevels: ['CRITICAL'],
      warnLevels: ['HIGH'],
      requireConfirmation: true
    });

    // Build response with unified schema
    const result = {
      layer: 'EXECUTION',
      service: 'execution_pre_trade_gate',
      schema_version: '1.0.0',
      gate_id: gateDecision.gate_id,
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - startTime,
      ...gateDecision,
      token,
      actionType,
      amount,
      chain,
      slippage,
      execution: {
        allowed: gateDecision.execution_allowed,
        requiresConfirmation: gateDecision.requires_confirmation,
        maxSlippage: slippage,
        recommendedGas: 'standard'
      },
      recommended_next_call: gateDecision.decision === 'WARN' ? {
        skill: 'validation_token_safety_scan',
        reason: 'WARN decision - deep scan recommended for final confirmation',
        estimated_time: '5-15 min',
        price: '$5 USD',
        upsell_value: 'Complete risk analysis before execution'
      } : null
    };
    
    // Cache result
    await cache.setGateResult(token, result, chain, 300);
    
    res.json(result);
    
  } catch (error) {
    console.error('Gate error:', error);
    res.status(500).json({
      error: error.message,
      decision: 'UNKNOWN',
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - startTime
    });
  }
});

// validation_token_safety_scan endpoint
app.post('/api/v1/scan', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { contractAddress, chain = 'ethereum' } = req.body;
    
    if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/i.test(contractAddress)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }
    
    // Check cache
    const cached = await cache.getScanResult(contractAddress, chain);
    if (cached) {
      cached.latency_ms = Date.now() - startTime;
      cached.cache = { hit: true };
      return res.json(cached);
    }
    
    // Full analysis
    const analysis = await analyzer.analyze(contractAddress);
    
    if (analysis.error) {
      return res.status(400).json({ error: analysis.error });
    }
    
    const result = {
      layer: 'VALIDATION',
      service: 'validation_token_safety_scan',
      schema_version: '1.0.0',
      timestamp: new Date().toISOString(),
      latency_ms: Date.now() - startTime,
      contractAddress,
      chain,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      checks: analysis.checks,
      evidence_bundle: {
        bundle_id: `eb_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sources: ['bytecode_analysis', 'opcode_pattern_matching'],
        confidence: 0.8,
        calibration_version: 'v1.0.0'
      },
      summary: this.generateSummary(analysis),
      nextSteps: {
        ifProceeding: 'Use execution_pre_trade_gate before any trade',
        ifUncertain: 'Use validation_token_compare against alternatives',
        ifHighRisk: 'Use discovery_risk_leaderboard to find safer options'
      },
      disclaimer: 'Validation layer - technical analysis only. Not investment advice.'
    };
    
    // Cache for 1 hour
    await cache.setScanResult(contractAddress, result, chain, 3600);
    
    res.json(result);
    
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  const stats = await cache.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: stats
  });
});

// Stats
app.get('/stats', async (req, res) => {
  const stats = await cache.getStats();
  res.json({
    service: 'blnk-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cache: stats
  });
});

function generateSummary(analysis) {
  const detected = Object.entries(analysis.checks)
    .filter(([_, v]) => v.detected)
    .map(([k, _]) => k);
  
  if (detected.length === 0) {
    return 'No significant risk patterns detected in bytecode analysis.';
  }
  
  return `Detected patterns: ${detected.join(', ')}. Risk level: ${analysis.riskLevel}.`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛡️  BLNK Backend running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   POST /api/v1/gate    - Pre-trade risk gate`);
  console.log(`   POST /api/v1/scan    - Token safety scan`);
  console.log(`   GET  /health         - Health check`);
  console.log(`   GET  /stats          - Statistics`);
});

module.exports = app;
