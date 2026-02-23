/**
 * BLNK Portfolio Intelligence Engine
 * Phase 3: Portfolio-level exposure intelligence
 */

const { RiskSchema } = require('./schema');

class PortfolioIntelligence {
  constructor() {
    this.portfolios = new Map();
  }

  // Create portfolio dashboard
  async createDashboard(walletAddress, holdings, options = {}) {
    const portfolioId = `portfolio_${Date.now()}`;
    
    // Analyze each holding
    const analyzedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const risk = await this.analyzeHolding(holding);
        return {
          ...holding,
          risk
        };
      })
    );

    // Calculate portfolio-level metrics
    const dashboard = {
      id: portfolioId,
      wallet: walletAddress,
      timestamp: new Date().toISOString(),
      schema_version: '1.0.0',
      
      summary: {
        totalValueUSD: this.calculateTotalValue(analyzedHoldings),
        tokenCount: holdings.length,
        averageRiskScore: this.calculateAverageRisk(analyzedHoldings),
        maxRiskScore: Math.max(...analyzedHoldings.map(h => h.risk.risk_score)),
        riskDistribution: this.calculateRiskDistribution(analyzedHoldings)
      },

      // Cross-chain exposure
      crossChainExposure: this.calculateCrossChainExposure(analyzedHoldings),

      // Concentration analysis
      concentration: {
        topHolding: this.getTopHolding(analyzedHoldings),
        top3Concentration: this.calculateTopNConcentration(analyzedHoldings, 3),
        sectorConcentration: this.calculateSectorConcentration(analyzedHoldings),
        chainConcentration: this.calculateChainConcentration(analyzedHoldings)
      },

      // Correlation clustering
      correlations: await this.calculateCorrelations(analyzedHoldings),

      // Liquidity dependency
      liquidityMap: this.calculateLiquidityDependency(analyzedHoldings),

      // Stablecoin depeg risk
      stablecoinRisk: this.assessStablecoinRisk(analyzedHoldings),

      // Holdings with risk
      holdings: analyzedHoldings,

      // Recommendations
      recommendations: this.generateRecommendations(analyzedHoldings),

      // Alert triggers
      alertConfig: {
        maxPortfolioRisk: options.maxPortfolioRisk || 50,
        maxSingleExposure: options.maxSingleExposure || 30,
        rebalanceThreshold: options.rebalanceThreshold || 10
      }
    };

    this.portfolios.set(portfolioId, dashboard);
    return dashboard;
  }

  async analyzeHolding(holding) {
    // Would call actual risk analysis
    return RiskSchema.create({
      riskScore: Math.random() * 60 + 10,
      confidence: 0.8,
      signals: [],
      evidence: []
    });
  }

  calculateTotalValue(holdings) {
    return holdings.reduce((sum, h) => sum + (h.valueUSD || 0), 0);
  }

  calculateAverageRisk(holdings) {
    const scores = holdings.map(h => h.risk.risk_score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  calculateRiskDistribution(holdings) {
    const distribution = {
      SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0
    };
    
    holdings.forEach(h => {
      distribution[h.risk.risk_level]++;
    });
    
    return distribution;
  }

  calculateCrossChainExposure(holdings) {
    const byChain = {};
    
    holdings.forEach(h => {
      const chain = h.chain || 'ethereum';
      if (!byChain[chain]) {
        byChain[chain] = { valueUSD: 0, tokens: [], riskScore: 0 };
      }
      byChain[chain].valueUSD += h.valueUSD || 0;
      byChain[chain].tokens.push(h.token);
    });

    // Calculate risk per chain
    Object.keys(byChain).forEach(chain => {
      const chainHoldings = holdings.filter(h => (h.chain || 'ethereum') === chain);
      byChain[chain].riskScore = this.calculateAverageRisk(chainHoldings);
      byChain[chain].percentage = 0; // Will calculate after total
    });

    return byChain;
  }

  getTopHolding(holdings) {
    return holdings.sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0))[0];
  }

  calculateTopNConcentration(holdings, n) {
    const sorted = holdings.sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));
    const topN = sorted.slice(0, n);
    const total = this.calculateTotalValue(holdings);
    const topNValue = this.calculateTotalValue(topN);
    
    return {
      percentage: total > 0 ? (topNValue / total) * 100 : 0,
      tokens: topN.map(h => h.token)
    };
  }

  calculateSectorConcentration(holdings) {
    // Would categorize by sector (DeFi, L1, L2, etc.)
    return {
      DeFi: 40,
      L1: 30,
      Stablecoin: 20,
      Other: 10
    };
  }

  calculateChainConcentration(holdings) {
    const byChain = {};
    const total = this.calculateTotalValue(holdings);
    
    holdings.forEach(h => {
      const chain = h.chain || 'ethereum';
      byChain[chain] = (byChain[chain] || 0) + (h.valueUSD || 0);
    });

    return Object.entries(byChain).map(([chain, value]) => ({
      chain,
      valueUSD: value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }));
  }

  async calculateCorrelations(holdings) {
    // Would calculate actual price correlations
    return holdings.map(h1 => ({
      token: h1.token,
      correlations: holdings
        .filter(h2 => h2.token !== h1.token)
        .map(h2 => ({
          with: h2.token,
          correlation: Math.random() * 2 - 1 // -1 to 1
        }))
    }));
  }

  calculateLiquidityDependency(holdings) {
    return holdings.map(h => ({
      token: h.token,
      primaryDEX: 'Uniswap V3',
      liquidityUSD: Math.random() * 1000000,
      depth10k: Math.random() * 5, // % price impact for $10k
      riskLevel: h.risk.risk_level
    }));
  }

  assessStablecoinRisk(holdings) {
    const stablecoins = holdings.filter(h => 
      ['USDC', 'USDT', 'DAI'].includes(h.symbol)
    );

    if (stablecoins.length === 0) return null;

    return {
      totalStableValue: this.calculateTotalValue(stablecoins),
      depegRisk: 'LOW',
      diversification: stablecoins.length > 1 ? 'GOOD' : 'CONCENTRATED',
      recommendations: stablecoins.length === 1 
        ? ['Consider diversifying across multiple stablecoins']
        : []
    };
  }

  generateRecommendations(holdings) {
    const recommendations = [];
    
    // Risk-based recommendations
    const highRisk = holdings.filter(h => h.risk.risk_score > 70);
    if (highRisk.length > 0) {
      recommendations.push({
        type: 'RISK_REDUCTION',
        priority: 'HIGH',
        message: `Consider reducing exposure to ${highRisk.length} high-risk tokens`,
        tokens: highRisk.map(h => h.token)
      });
    }

    // Concentration recommendations
    const top3 = this.calculateTopNConcentration(holdings, 3);
    if (top3.percentage > 50) {
      recommendations.push({
        type: 'DIVERSIFICATION',
        priority: 'MEDIUM',
        message: `Top 3 holdings represent ${top3.percentage.toFixed(1)}% of portfolio`,
        suggestion: 'Consider rebalancing to reduce concentration risk'
      });
    }

    return recommendations;
  }

  // Batch scan for multiple portfolios
  async batchScan(portfolios) {
    const results = await Promise.all(
      portfolios.map(async (portfolio) => {
        const dashboard = await this.createDashboard(
          portfolio.wallet,
          portfolio.holdings
        );
        return {
          wallet: portfolio.wallet,
          riskScore: dashboard.summary.averageRiskScore,
          maxRiskToken: dashboard.concentration.topHolding.token,
          recommendation: dashboard.recommendations[0]?.message || 'No action needed'
        };
      })
    );

    return {
      scanId: `batch_${Date.now()}`,
      timestamp: new Date().toISOString(),
      portfoliosScanned: portfolios.length,
      highRiskCount: results.filter(r => r.riskScore > 50).length,
      results
    };
  }
}

module.exports = { PortfolioIntelligence };
