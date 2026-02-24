/**
 * BLNK Custom Risk Scoring Engine
 * User-defined weights and project-specific risk models
 */

class CustomRiskEngine {
  constructor() {
    // Default risk factors
    this.defaultFactors = {
      ownership: { weight: 0.20, name: 'Ownership Pattern' },
      mintable: { weight: 0.25, name: 'Mintable Risk' },
      blacklist: { weight: 0.20, name: 'Blacklist Function' },
      upgradeable: { weight: 0.15, name: 'Upgradeable Risk' },
      pausable: { weight: 0.10, name: 'Pausable Risk' },
      liquidity: { weight: 0.10, name: 'Liquidity Risk' }
    };
    
    // User-defined models storage (in production: database)
    this.userModels = new Map();
    
    // Pre-built templates
    this.templates = {
      conservative: {
        name: 'Conservative',
        description: 'Low risk tolerance - strict criteria',
        factors: {
          ownership: 0.15,
          mintable: 0.30,
          blacklist: 0.25,
          upgradeable: 0.15,
          pausable: 0.10,
          liquidity: 0.05
        },
        thresholds: {
          BLOCK: 40,
          WARN: 25,
          PASS: 0
        }
      },
      aggressive: {
        name: 'Aggressive',
        description: 'High risk tolerance - focus on gains',
        factors: {
          ownership: 0.25,
          mintable: 0.15,
          blacklist: 0.15,
          upgradeable: 0.20,
          pausable: 0.10,
          liquidity: 0.15
        },
        thresholds: {
          BLOCK: 70,
          WARN: 50,
          PASS: 0
        }
      },
      defi_yield: {
        name: 'DeFi Yield',
        description: 'Optimized for yield farming',
        factors: {
          ownership: 0.10,
          mintable: 0.20,
          blacklist: 0.30,
          upgradeable: 0.10,
          pausable: 0.20,
          liquidity: 0.10
        },
        thresholds: {
          BLOCK: 55,
          WARN: 35,
          PASS: 0
        }
      },
      institutional: {
        name: 'Institutional',
        description: 'Enterprise-grade compliance',
        factors: {
          ownership: 0.20,
          mintable: 0.20,
          blacklist: 0.20,
          upgradeable: 0.20,
          pausable: 0.10,
          liquidity: 0.10
        },
        thresholds: {
          BLOCK: 35,
          WARN: 20,
          PASS: 0
        }
      }
    };
  }
  
  /**
   * Create custom risk model
   */
  createModel(userId, modelConfig) {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const model = {
      id: modelId,
      userId,
      name: modelConfig.name || 'Custom Model',
      description: modelConfig.description || '',
      factors: this.validateFactors(modelConfig.factors),
      thresholds: {
        BLOCK: modelConfig.thresholds?.BLOCK || 70,
        WARN: modelConfig.thresholds?.WARN || 40,
        PASS: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.userModels.set(modelId, model);
    return model;
  }
  
  /**
   * Validate factor weights sum to 1.0
   */
  validateFactors(factors) {
    if (!factors) return this.defaultFactors;
    
    const validFactors = {};
    let totalWeight = 0;
    
    for (const [key, value] of Object.entries(factors)) {
      const weight = parseFloat(value);
      if (weight >= 0 && weight <= 1) {
        validFactors[key] = {
          weight,
          name: this.defaultFactors[key]?.name || key
        };
        totalWeight += weight;
      }
    }
    
    // Normalize if total != 1.0
    if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.001) {
      for (const key in validFactors) {
        validFactors[key].weight /= totalWeight;
      }
    }
    
    return validFactors;
  }
  
  /**
   * Calculate risk score using custom model
   */
  calculateScore(analysis, modelId = null) {
    let model;
    
    if (modelId && this.userModels.has(modelId)) {
      model = this.userModels.get(modelId);
    } else if (modelId && this.templates[modelId]) {
      model = this.templates[modelId];
    } else {
      model = { factors: this.defaultFactors, thresholds: { BLOCK: 70, WARN: 40, PASS: 0 } };
    }
    
    let score = 0;
    const breakdown = {};
    
    for (const [factor, config] of Object.entries(model.factors)) {
      const detected = analysis.checks?.[factor] || false;
      const factorScore = detected ? 100 * config.weight : 0;
      score += factorScore;
      
      breakdown[factor] = {
        detected,
        weight: config.weight,
        contribution: factorScore,
        name: config.name
      };
    }
    
    // Determine decision
    let decision = 'PASS';
    if (score >= model.thresholds.BLOCK) {
      decision = 'BLOCK';
    } else if (score >= model.thresholds.WARN) {
      decision = 'WARN';
    }
    
    return {
      score: Math.round(score),
      decision,
      breakdown,
      model: {
        id: model.id || modelId || 'default',
        name: model.name || 'Default'
      },
      thresholds: model.thresholds
    };
  }
  
  /**
   * Get all templates
   */
  getTemplates() {
    return Object.entries(this.templates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      factors: template.factors,
      thresholds: template.thresholds
    }));
  }
  
  /**
   * Get user's custom models
   */
  getUserModels(userId) {
    const models = [];
    for (const [id, model] of this.userModels) {
      if (model.userId === userId) {
        models.push({
          id,
          name: model.name,
          description: model.description,
          createdAt: model.createdAt
        });
      }
    }
    return models;
  }
  
  /**
   * Update custom model
   */
  updateModel(modelId, updates) {
    if (!this.userModels.has(modelId)) {
      throw new Error('Model not found');
    }
    
    const model = this.userModels.get(modelId);
    
    if (updates.name) model.name = updates.name;
    if (updates.description) model.description = updates.description;
    if (updates.factors) model.factors = this.validateFactors(updates.factors);
    if (updates.thresholds) {
      model.thresholds = {
        ...model.thresholds,
        ...updates.thresholds
      };
    }
    
    model.updatedAt = Date.now();
    return model;
  }
  
  /**
   * Delete custom model
   */
  deleteModel(modelId) {
    return this.userModels.delete(modelId);
  }
  
  /**
   * Compare multiple models
   */
  compareModels(analysis, modelIds) {
    const results = [];
    
    for (const modelId of modelIds) {
      const result = this.calculateScore(analysis, modelId);
      results.push({
        modelId,
        modelName: result.model.name,
        score: result.score,
        decision: result.decision
      });
    }
    
    return results.sort((a, b) => a.score - b.score);
  }
}

module.exports = { CustomRiskEngine };
