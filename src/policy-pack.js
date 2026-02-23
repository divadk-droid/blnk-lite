/**
 * BLNK Policy Pack
 * Compliance-based risk decisions
 */

class PolicyPack {
  constructor() {
    // Pre-defined policy templates
    this.policies = {
      'conservative': {
        name: 'Conservative',
        description: 'Maximum safety - blocks any suspicious patterns',
        rules: {
          blockUpgradeable: true,
          blockMintable: true,
          blockBlacklist: true,
          blockPausable: true,
          maxTaxPercent: 0,
          minLiquidityUSD: 100000,
          requireVerified: true
        }
      },
      'moderate': {
        name: 'Moderate',
        description: 'Balanced approach - allows verified tokens with warnings',
        rules: {
          blockUpgradeable: false,
          blockMintable: true,
          blockBlacklist: true,
          blockPausable: false,
          maxTaxPercent: 5,
          minLiquidityUSD: 50000,
          requireVerified: false
        }
      },
      'aggressive': {
        name: 'Aggressive',
        description: 'High risk tolerance - only blocks critical issues',
        rules: {
          blockUpgradeable: false,
          blockMintable: false,
          blockBlacklist: false,
          blockPausable: false,
          maxTaxPercent: 10,
          minLiquidityUSD: 10000,
          requireVerified: false
        }
      },
      'defi_yield': {
        name: 'DeFi Yield',
        description: 'Optimized for yield farming - blocks honeypots only',
        rules: {
          blockUpgradeable: false,
          blockMintable: false,
          blockBlacklist: true,
          blockPausable: false,
          maxTaxPercent: 3,
          minLiquidityUSD: 200000,
          requireVerified: true
        }
      }
    };
  }

  // Evaluate token against policy
  evaluate(token, policyId, tokenData = {}) {
    const policy = this.policies[policyId] || this.policies.moderate;
    const rules = policy.rules;
    
    const violations = [];
    
    // Check each rule
    if (rules.blockUpgradeable && tokenData.isUpgradeable) {
      violations.push({
        rule: 'blockUpgradeable',
        severity: 'high',
        message: 'Token is upgradeable'
      });
    }
    
    if (rules.blockMintable && tokenData.isMintable) {
      violations.push({
        rule: 'blockMintable',
        severity: 'critical',
        message: 'Token has mint function'
      });
    }
    
    if (rules.blockBlacklist && tokenData.hasBlacklist) {
      violations.push({
        rule: 'blockBlacklist',
        severity: 'critical',
        message: 'Token has blacklist function'
      });
    }
    
    if (rules.blockPausable && tokenData.isPausable) {
      violations.push({
        rule: 'blockPausable',
        severity: 'medium',
        message: 'Token is pausable'
      });
    }
    
    if (tokenData.taxPercent > rules.maxTaxPercent) {
      violations.push({
        rule: 'maxTaxPercent',
        severity: 'medium',
        message: `Tax ${tokenData.taxPercent}% exceeds limit ${rules.maxTaxPercent}%`
      });
    }
    
    if (tokenData.liquidityUSD < rules.minLiquidityUSD) {
      violations.push({
        rule: 'minLiquidityUSD',
        severity: 'medium',
        message: `Liquidity $${tokenData.liquidityUSD} below minimum $${rules.minLiquidityUSD}`
      });
    }
    
    // Determine verdict
    let verdict = 'PASS';
    if (violations.some(v => v.severity === 'critical')) {
      verdict = 'BLOCK';
    } else if (violations.length > 0) {
      verdict = 'WARN';
    }
    
    return {
      policy_id: policyId,
      policy_name: policy.name,
      token,
      verdict,
      violations,
      violation_count: violations.length,
      rules_applied: Object.keys(rules).length,
      timestamp: new Date().toISOString()
    };
  }

  // Get available policies
  listPolicies() {
    return Object.entries(this.policies).map(([id, policy]) => ({
      id,
      name: policy.name,
      description: policy.description,
      rule_count: Object.keys(policy.rules).length
    }));
  }

  // Create custom policy
  createPolicy(id, name, description, rules) {
    this.policies[id] = {
      name,
      description,
      rules: {
        ...this.policies.moderate.rules,
        ...rules
      }
    };
    return this.policies[id];
  }
}

module.exports = { PolicyPack };
