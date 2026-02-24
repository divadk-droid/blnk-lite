/**
 * Advanced Multi-Dimensional Risk Scoring Engine
 * Portfolio Guardian-style comprehensive risk analysis
 */

class AdvancedRiskScoring {
  constructor() {
    this.weights = {
      technical: 0.25,
      financial: 0.25,
      operational: 0.20,
      market: 0.20,
      social: 0.10
    };
    
    this.riskLevels = {
      CRITICAL: { min: 80, max: 100, action: 'BLOCK' },
      HIGH: { min: 60, max: 79, action: 'WARN' },
      MEDIUM: { min: 40, max: 59, action: 'REVIEW' },
      LOW: { min: 20, max: 39, action: 'MONITOR' },
      SAFE: { min: 0, max: 19, action: 'PASS' }
    };
  }

  /**
   * Calculate comprehensive risk score across 5 dimensions
   */
  async calculateRiskScore(tokenAddress, context = {}) {
    const dimensions = await Promise.all([
      this.assessTechnicalRisk(tokenAddress),
      this.assessFinancialRisk(tokenAddress, context),
      this.assessOperationalRisk(tokenAddress),
      this.assessMarketRisk(tokenAddress, context),
      this.assessSocialRisk(tokenAddress)
    ]);

    const [technical, financial, operational, market, social] = dimensions;

    // Calculate weighted composite score
    const compositeScore = Math.round(
      technical.score * this.weights.technical +
      financial.score * this.weights.financial +
      operational.score * this.weights.operational +
      market.score * this.weights.market +
      social.score * this.weights.social
    );

    // Determine risk level
    const riskLevel = this.getRiskLevel(compositeScore);

    return {
      composite_score: compositeScore,
      risk_level: riskLevel.name,
      action: riskLevel.action,
      confidence: this.calculateConfidence(dimensions),
      dimensions: {
        technical,
        financial,
        operational,
        market,
        social
      },
      breakdown: this.generateBreakdown(dimensions),
      recommendations: this.generateRecommendations(dimensions, compositeScore)
    };
  }

  /**
   * Technical Risk Assessment
   * Smart contract code quality, vulnerabilities, audits
   */
  async assessTechnicalRisk(tokenAddress) {
    const factors = {
      contract_verified: { weight: 20, score: 0 },
      audit_status: { weight: 25, score: 0 },
      code_complexity: { weight: 15, score: 0 },
      upgradeability: { weight: 15, score: 0 },
      vulnerability_count: { weight: 25, score: 0 }
    };

    // Check if contract is verified
    factors.contract_verified.score = await this.checkContractVerified(tokenAddress) ? 0 : 50;

    // Audit status
    const auditInfo = await this.getAuditInfo(tokenAddress);
    factors.audit_status.score = auditInfo.hasAudit ? (auditInfo.issues > 0 ? 30 : 0) : 70;

    // Code complexity (proxy patterns, etc.)
    factors.code_complexity.score = await this.assessCodeComplexity(tokenAddress);

    // Upgradeability risk
    factors.upgradeability.score = await this.checkUpgradeabilityRisk(tokenAddress);

    // Known vulnerabilities
    factors.vulnerability_count.score = await this.countVulnerabilities(tokenAddress) * 15;

    const score = this.calculateDimensionScore(factors);
    
    return {
      name: 'Technical',
      score,
      weight: this.weights.technical,
      factors,
      indicators: this.getTechnicalIndicators(tokenAddress)
    };
  }

  /**
   * Financial Risk Assessment
   * Liquidity, volatility, concentration
   */
  async assessFinancialRisk(tokenAddress, context) {
    const factors = {
      liquidity_depth: { weight: 30, score: 0 },
      price_volatility: { weight: 25, score: 0 },
      holder_concentration: { weight: 20, score: 0 },
      market_cap_stability: { weight: 15, score: 0 },
      trading_volume: { weight: 10, score: 0 }
    };

    // Liquidity depth
    const liquidity = await this.getLiquidityDepth(tokenAddress);
    factors.liquidity_depth.score = liquidity < 100000 ? 80 : liquidity < 1000000 ? 40 : 10;

    // Price volatility (30-day)
    const volatility = await this.getPriceVolatility(tokenAddress);
    factors.price_volatility.score = volatility > 50 ? 80 : volatility > 20 ? 40 : 10;

    // Holder concentration (top 10 holders)
    const concentration = await this.getHolderConcentration(tokenAddress);
    factors.holder_concentration.score = concentration > 80 ? 90 : concentration > 50 ? 50 : 10;

    // Market cap stability
    factors.market_cap_stability.score = await this.assessMarketCapStability(tokenAddress);

    // Trading volume
    const volume = await this.getTradingVolume(tokenAddress);
    factors.trading_volume.score = volume < 10000 ? 60 : volume < 100000 ? 30 : 5;

    const score = this.calculateDimensionScore(factors);

    return {
      name: 'Financial',
      score,
      weight: this.weights.financial,
      factors,
      indicators: {
        liquidity_usd: liquidity,
        volatility_30d: volatility,
        top10_concentration: concentration
      }
    };
  }

  /**
   * Operational Risk Assessment
   * Team, governance, transparency
   */
  async assessOperationalRisk(tokenAddress) {
    const factors = {
      team_doxxed: { weight: 25, score: 0 },
      governance_active: { weight: 20, score: 0 },
      documentation_quality: { weight: 20, score: 0 },
      communication_frequency: { weight: 20, score: 0 },
      incident_history: { weight: 15, score: 0 }
    };

    factors.team_doxxed.score = await this.isTeamDoxxed(tokenAddress) ? 0 : 60;
    factors.governance_active.score = await this.hasActiveGovernance(tokenAddress) ? 10 : 50;
    factors.documentation_quality.score = await this.assessDocumentation(tokenAddress);
    factors.communication_frequency.score = await this.checkCommunication(tokenAddress);
    factors.incident_history.score = await this.getIncidentHistory(tokenAddress);

    const score = this.calculateDimensionScore(factors);

    return {
      name: 'Operational',
      score,
      weight: this.weights.operational,
      factors
    };
  }

  /**
   * Market Risk Assessment
   * Market conditions, correlation, systemic risk
   */
  async assessMarketRisk(tokenAddress, context) {
    const factors = {
      market_correlation: { weight: 30, score: 0 },
      systemic_risk: { weight: 25, score: 0 },
      regulatory_risk: { weight: 25, score: 0 },
      competitive_position: { weight: 20, score: 0 }
    };

    factors.market_correlation.score = await this.calculateMarketCorrelation(tokenAddress);
    factors.systemic_risk.score = context.marketCondition === 'bear' ? 60 : 20;
    factors.regulatory_risk.score = await this.assessRegulatoryRisk(tokenAddress);
    factors.competitive_position.score = await this.assessCompetitivePosition(tokenAddress);

    const score = this.calculateDimensionScore(factors);

    return {
      name: 'Market',
      score,
      weight: this.weights.market,
      factors,
      context: {
        market_condition: context.marketCondition || 'neutral'
      }
    };
  }

  /**
   * Social Risk Assessment
   * Community, sentiment, reputation
   */
  async assessSocialRisk(tokenAddress) {
    const factors = {
      community_size: { weight: 25, score: 0 },
      sentiment_score: { weight: 30, score: 0 },
      reputation_score: { weight: 25, score: 0 },
      developer_activity: { weight: 20, score: 0 }
    };

    factors.community_size.score = await this.assessCommunitySize(tokenAddress);
    factors.sentiment_score.score = await this.analyzeSentiment(tokenAddress);
    factors.reputation_score.score = await this.checkReputation(tokenAddress);
    factors.developer_activity.score = await this.assessDevActivity(tokenAddress);

    const score = this.calculateDimensionScore(factors);

    return {
      name: 'Social',
      score,
      weight: this.weights.social,
      factors
    };
  }

  // Helper methods
  calculateDimensionScore(factors) {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const [_, factor] of Object.entries(factors)) {
      totalWeight += factor.weight;
      weightedScore += factor.score * (factor.weight / 100);
    }

    return Math.round(weightedScore);
  }

  getRiskLevel(score) {
    for (const [name, level] of Object.entries(this.riskLevels)) {
      if (score >= level.min && score <= level.max) {
        return { name, action: level.action };
      }
    }
    return { name: 'UNKNOWN', action: 'REVIEW' };
  }

  calculateConfidence(dimensions) {
    const validDimensions = dimensions.filter(d => d.score !== null);
    const dataCompleteness = validDimensions.length / dimensions.length;
    const variance = this.calculateVariance(validDimensions.map(d => d.score));
    
    return Math.round((dataCompleteness * 0.7 + (1 - variance / 100) * 0.3) * 100);
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  generateBreakdown(dimensions) {
    return dimensions.map(d => ({
      dimension: d.name,
      score: d.score,
      contribution: Math.round(d.score * d.weight),
      weight: d.weight
    })).sort((a, b) => b.contribution - a.contribution);
  }

  generateRecommendations(dimensions, compositeScore) {
    const recommendations = [];

    // Add dimension-specific recommendations
    for (const dim of dimensions) {
      if (dim.score >= 60) {
        recommendations.push({
          priority: 'HIGH',
          dimension: dim.name,
          action: `Address ${dim.name.toLowerCase()} risks`,
          details: this.getDimensionRecommendations(dim)
        });
      }
    }

    // Add composite score recommendations
    if (compositeScore >= 80) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'BLOCK transaction',
        reason: 'Critical risk level detected'
      });
    } else if (compositeScore >= 60) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Manual review required',
        reason: 'High risk level detected'
      });
    }

    return recommendations.sort((a, b) => 
      (a.priority === 'CRITICAL' ? 3 : a.priority === 'HIGH' ? 2 : 1) -
      (b.priority === 'CRITICAL' ? 3 : b.priority === 'HIGH' ? 2 : 1)
    );
  }

  // Placeholder methods for actual implementation
  async checkContractVerified(address) { return true; }
  async getAuditInfo(address) { return { hasAudit: false, issues: 0 }; }
  async assessCodeComplexity(address) { return 30; }
  async checkUpgradeabilityRisk(address) { return 20; }
  async countVulnerabilities(address) { return 0; }
  async getLiquidityDepth(address) { return 1000000; }
  async getPriceVolatility(address) { return 15; }
  async getHolderConcentration(address) { return 40; }
  async assessMarketCapStability(address) { return 20; }
  async getTradingVolume(address) { return 500000; }
  async isTeamDoxxed(address) { return false; }
  async hasActiveGovernance(address) { return false; }
  async assessDocumentation(address) { return 30; }
  async checkCommunication(address) { return 40; }
  async getIncidentHistory(address) { return 0; }
  async calculateMarketCorrelation(address) { return 30; }
  async assessRegulatoryRisk(address) { return 25; }
  async assessCompetitivePosition(address) { return 35; }
  async assessCommunitySize(address) { return 30; }
  async analyzeSentiment(address) { return 25; }
  async checkReputation(address) { return 20; }
  async assessDevActivity(address) { return 35; }
  getTechnicalIndicators(address) { return {}; }
  getDimensionRecommendations(dim) { return []; }
}

module.exports = { AdvancedRiskScoring };
