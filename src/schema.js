/**
 * BLNK Unified Risk Schema v1.0
 * All validation outputs must follow this standard
 */

const RiskLevel = {
  SAFE: 'SAFE',           // 0-10
  LOW: 'LOW',             // 11-30
  MEDIUM: 'MEDIUM',       // 31-50
  HIGH: 'HIGH',           // 51-70
  CRITICAL: 'CRITICAL'    // 71-100
};

const SignalType = {
  OWNABLE: 'ownable',
  MINTABLE: 'mintable',
  BLACKLIST: 'blacklist',
  UPGRADEABLE: 'upgradeable',
  TAX: 'tax',
  PAUSABLE: 'pausable',
  SUSPICIOUS: 'suspicious',
  LIQUIDITY_RISK: 'liquidity_risk',
  COUNTERPARTY_RISK: 'counterparty_risk',
  CONCENTRATION_RISK: 'concentration_risk'
};

class RiskSchema {
  static create({
    riskScore = 0,
    confidence = 0.5,
    signals = [],
    evidence = [],
    metadata = {}
  }) {
    return {
      schema_version: '1.0.0',
      risk_score: Math.min(100, Math.max(0, Math.round(riskScore))),
      risk_level: this.getRiskLevel(riskScore),
      confidence: Math.min(1, Math.max(0, confidence)),
      signals: signals.map(s => ({
        type: s.type,
        severity: s.severity || 'low',
        description: s.description,
        evidence_refs: s.evidenceRefs || []
      })),
      evidence: evidence.map(e => ({
        id: e.id,
        type: e.type,
        source: e.source,
        timestamp: e.timestamp || new Date().toISOString(),
        data: e.data
      })),
      last_updated: new Date().toISOString(),
      metadata: {
        calibration_version: metadata.calibrationVersion || 'v1.0.0',
        engine_version: metadata.engineVersion || 'v1.0.0',
        ...metadata
      }
    };
  }

  static getRiskLevel(score) {
    if (score <= 10) return RiskLevel.SAFE;
    if (score <= 30) return RiskLevel.LOW;
    if (score <= 50) return RiskLevel.MEDIUM;
    if (score <= 70) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  static merge(schemas, weights = []) {
    // Weighted average for portfolio-level aggregation
    const totalWeight = weights.reduce((a, b) => a + b, 0) || schemas.length;
    
    const weightedScore = schemas.reduce((sum, schema, i) => {
      const weight = weights[i] || 1;
      return sum + (schema.risk_score * weight);
    }, 0) / totalWeight;

    const allSignals = schemas.flatMap(s => s.signals);
    const uniqueSignals = this.deduplicateSignals(allSignals);

    return this.create({
      riskScore: weightedScore,
      confidence: Math.min(...schemas.map(s => s.confidence)),
      signals: uniqueSignals,
      evidence: schemas.flatMap(s => s.evidence),
      metadata: { aggregated: true, source_count: schemas.length }
    });
  }

  static deduplicateSignals(signals) {
    const seen = new Set();
    return signals.filter(s => {
      const key = `${s.type}-${s.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Execution Gate Decision Engine
class ExecutionGate {
  static evaluate(riskSchema, policy = {}) {
    const {
      maxRiskScore = 70,
      blockLevels = ['CRITICAL'],
      warnLevels = ['HIGH'],
      requireConfirmation = true
    } = policy;

    const decision = this.makeDecision(riskSchema, {
      maxRiskScore,
      blockLevels,
      warnLevels
    });

    return {
      decision: decision.verdict, // PASS | WARN | BLOCK
      risk_schema: riskSchema,
      policy_applied: policy,
      requires_confirmation: decision.verdict === 'WARN' && requireConfirmation,
      execution_allowed: decision.verdict !== 'BLOCK',
      warnings: decision.warnings,
      violations: decision.violations,
      timestamp: new Date().toISOString(),
      gate_id: `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audit_trail: {
        schema_version: riskSchema.schema_version,
        decision_version: 'v1.0.0',
        evidence_bundle_id: riskSchema.evidence?.[0]?.id
      }
    };
  }

  static makeDecision(schema, policy) {
    const warnings = [];
    const violations = [];

    // Check risk level blocks
    if (policy.blockLevels.includes(schema.risk_level)) {
      violations.push(`Risk level ${schema.risk_level} is in block list`);
      return { verdict: 'BLOCK', warnings, violations };
    }

    // Check score threshold
    if (schema.risk_score > policy.maxRiskScore) {
      violations.push(`Risk score ${schema.risk_score} exceeds maximum ${policy.maxRiskScore}`);
      return { verdict: 'BLOCK', warnings, violations };
    }

    // Check confidence threshold
    if (schema.confidence < 0.5) {
      warnings.push('Low confidence in risk assessment');
    }

    // Check for critical signals
    const criticalSignals = schema.signals.filter(s => 
      s.severity === 'critical' || s.type === 'SUSPICIOUS'
    );
    if (criticalSignals.length > 0) {
      violations.push(`Critical signals detected: ${criticalSignals.map(s => s.type).join(', ')}`);
      return { verdict: 'BLOCK', warnings, violations };
    }

    // Check warn levels
    if (policy.warnLevels.includes(schema.risk_level)) {
      warnings.push(`Risk level ${schema.risk_level} requires review`);
      return { verdict: 'WARN', warnings, violations };
    }

    return { verdict: 'PASS', warnings, violations };
  }
}

// SLA Engine
class SLAEngine {
  constructor(config = {}) {
    this.queues = {
      institutional: { priority: 1, maxLatency: 1000 },
      priority: { priority: 2, maxLatency: 3000 },
      standard: { priority: 3, maxLatency: 5000 },
      free: { priority: 4, maxLatency: 30000 }
    };
    this.spikeThreshold = config.spikeThreshold || 5;
    this.degradationEnabled = config.degradationEnabled !== false;
  }

  async route(request, tier = 'standard') {
    const queue = this.queues[tier] || this.queues.standard;
    const startTime = Date.now();

    try {
      // Check for spike
      const currentLoad = await this.getCurrentLoad();
      if (currentLoad > this.spikeThreshold) {
        if (this.degradationEnabled && tier === 'free') {
          throw new Error('Service temporarily degraded due to high demand');
        }
      }

      // Process with timeout
      const result = await this.processWithTimeout(request, queue.maxLatency);
      
      return {
        result,
        sla: {
          tier,
          max_latency_ms: queue.maxLatency,
          actual_latency_ms: Date.now() - startTime,
          met_sla: (Date.now() - startTime) < queue.maxLatency
        }
      };
    } catch (error) {
      return {
        error: error.message,
        sla: {
          tier,
          failed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async processWithTimeout(request, timeoutMs) {
    // Implementation would use actual async processing
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request exceeded ${timeoutMs}ms SLA`));
      }, timeoutMs);

      // Simulate processing
      setTimeout(() => {
        clearTimeout(timer);
        resolve({ processed: true, request });
      }, Math.random() * timeoutMs * 0.5);
    });
  }

  async getCurrentLoad() {
    // Would check actual queue depth
    return 1.0;
  }
}

module.exports = {
  RiskSchema,
  ExecutionGate,
  SLAEngine,
  RiskLevel,
  SignalType
};
