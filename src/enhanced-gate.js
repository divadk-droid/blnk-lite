/**
 * Enhanced Gate with MEV Protection and Advanced Risk Scoring
 * Integrates new features into existing gate system
 */

const { MEVProtection } = require('./mev-protection');
const { AdvancedRiskScoring } = require('./advanced-risk-scoring');
const { VulnerabilityPatternDB } = require('./vulnerability-pattern-db');

class EnhancedGate {
  constructor(provider) {
    this.mevProtection = new MEVProtection(provider);
    this.riskScoring = new AdvancedRiskScoring();
    this.vulnDB = new VulnerabilityPatternDB();
  }

  /**
   * Enhanced pre-trade check with all new features
   */
  async enhancedPreTradeCheck(params) {
    const {
      tokenAddress,
      amount,
      bytecode,
      txParams // For MEV analysis
    } = params;

    const results = {
      timestamp: new Date().toISOString(),
      token: tokenAddress,
      checks: {}
    };

    // 1. Advanced Risk Scoring (5 dimensions)
    console.log('Running advanced risk scoring...');
    results.checks.riskScore = await this.riskScoring.calculateRiskScore(tokenAddress, {
      marketCondition: 'neutral'
    });

    // 2. Vulnerability Scan
    console.log('Scanning for vulnerabilities...');
    results.checks.vulnerabilities = await this.vulnDB.scanForVulnerabilities(bytecode);

    // 3. MEV Protection (if transaction params provided)
    if (txParams) {
      console.log('Analyzing MEV risks...');
      results.checks.mevProtection = await this.mevProtection.analyzeMEVRisk(txParams);
    }

    // 4. Calculate final decision
    results.decision = this.calculateFinalDecision(results.checks);

    return results;
  }

  /**
   * Calculate final decision based on all checks
   */
  calculateFinalDecision(checks) {
    const scores = {
      risk: checks.riskScore?.composite_score || 0,
      vulnerability: checks.vulnerabilities?.risk_score || 0,
      mev: checks.mevProtection?.risk_level === 'HIGH' ? 80 : 
           checks.mevProtection?.risk_level === 'MEDIUM' ? 50 : 0
    };

    // Weighted average
    const finalScore = Math.round(
      scores.risk * 0.4 +
      scores.vulnerability * 0.4 +
      scores.mev * 0.2
    );

    // Determine action
    let action, reason;
    if (finalScore >= 80) {
      action = 'BLOCK';
      reason = 'Critical risk detected across multiple dimensions';
    } else if (finalScore >= 60) {
      action = 'WARN';
      reason = 'High risk - manual review recommended';
    } else if (finalScore >= 40) {
      action = 'REVIEW';
      reason = 'Medium risk - proceed with caution';
    } else {
      action = 'PASS';
      reason = 'Low risk - safe to proceed';
    }

    return {
      action,
      reason,
      final_score: finalScore,
      component_scores: scores,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { EnhancedGate };
