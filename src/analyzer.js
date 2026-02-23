const { ethers } = require('ethers');
const axios = require('axios');

// Bytecode signature patterns
const PATTERNS = {
  // Ownable patterns
  ownable: [
    '8da5cb5b', // owner()
    'f2fde38b', // transferOwnership(address)
    '79ba5097', // acceptOwnership()
  ],
  // Minting patterns
  mintable: [
    '40c10f19', // mint(address,uint256)
    'a0712d68', // mint(uint256)
    '449a52f8', // mint(address,uint256,bytes)
  ],
  // Blacklist patterns
  blacklist: [
    'e47d606b', // blacklist(address)
    '44337ea1', // blacklist(address[])
    'f9f92be4', // isBlacklisted(address)
    'b2c20a85', // blacklisted(address)
  ],
  // Upgradeable patterns
  upgradeable: [
    '3659cfe6', // upgradeTo(address)
    '4f1ef286', // upgradeToAndCall(address,bytes)
    '5c60da1b', // implementation()
    'f851a440', // admin()
  ],
  // Tax/Fee patterns
  tax: [
    'd505accf', // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
    'c8c8ebe4', // swapAndLiquify()
    '8ee88c53', // swapTokensForEth(uint256)
  ],
  // Pause patterns
  pausable: [
    '8456cb59', // pause()
    '3f4ba83a', // unpause()
    '5c975abb', // paused()
  ],
  // Hidden mint / suspicious
  suspicious: [
    '0a3b0a4f', // destroy(address)
    '9dc29fac', // burnFrom(address,uint256) - if not standard ERC20
    'a9059cbb', // transfer - check for custom implementation
  ]
};

class ContractAnalyzer {
  constructor(providerUrl) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
  }

  async analyze(contractAddress) {
    try {
      // Get bytecode
      const code = await this.provider.getCode(contractAddress);
      
      if (code === '0x') {
        return { error: 'Not a contract' };
      }

      const bytecode = code.toLowerCase();
      const results = {
        address: contractAddress,
        bytecodeLength: bytecode.length,
        timestamp: new Date().toISOString(),
        checks: {}
      };

      // Check each pattern
      for (const [category, signatures] of Object.entries(PATTERNS)) {
        const found = signatures.filter(sig => bytecode.includes(sig));
        results.checks[category] = {
          detected: found.length > 0,
          matches: found,
          riskScore: this.getRiskScore(category, found.length)
        };
      }

      // Calculate overall risk
      results.riskScore = this.calculateOverallRisk(results.checks);
      results.riskLevel = this.getRiskLevel(results.riskScore);

      // Get basic contract info
      results.codeHash = ethers.keccak256(code).slice(0, 18);
      
      return results;
    } catch (error) {
      return { 
        error: error.message,
        address: contractAddress 
      };
    }
  }

  getRiskScore(category, matchCount) {
    const scores = {
      ownable: 5,
      mintable: 30,
      blacklist: 20,
      upgradeable: 15,
      tax: 10,
      pausable: 10,
      suspicious: 40
    };
    return matchCount > 0 ? scores[category] || 5 : 0;
  }

  calculateOverallRisk(checks) {
    let totalScore = 0;
    let maxPossible = 0;

    for (const [category, check] of Object.entries(checks)) {
      totalScore += check.riskScore;
      maxPossible += 40; // max per category
    }

    // Normalize to 0-100
    return Math.min(100, Math.round((totalScore / maxPossible) * 100));
  }

  getRiskLevel(score) {
    if (score >= 70) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    if (score >= 10) return 'LOW';
    return 'SAFE';
  }

  // Quick check for gate (cached, lightweight)
  async quickCheck(contractAddress) {
    const result = await this.analyze(contractAddress);
    
    if (result.error) {
      return {
        decision: 'BLOCK',
        reason: result.error,
        confidence: 1.0
      };
    }

    // Gate logic - refined
    const criticalFlags = [
      result.checks.mintable.detected && !result.checks.ownable.detected, // Mint without ownership is suspicious
      result.checks.suspicious.detected,
      result.riskScore >= 80
    ];

    const warnFlags = [
      result.checks.blacklist.detected,
      result.checks.upgradeable.detected,
      result.riskScore >= 40
    ];

    if (criticalFlags.some(f => f)) {
      return {
        decision: 'BLOCK',
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        flags: result.checks,
        confidence: 0.85,
        reason: 'Critical risk patterns detected'
      };
    }

    if (warnFlags.some(f => f)) {
      return {
        decision: 'WARN',
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        flags: result.checks,
        confidence: 0.75,
        reason: 'Risk patterns detected, review recommended'
      };
    }

    return {
      decision: 'PASS',
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      flags: result.checks,
      confidence: 0.9,
      reason: 'No significant risk patterns'
    };
  }
}

module.exports = { ContractAnalyzer, PATTERNS };
