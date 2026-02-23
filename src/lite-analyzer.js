const { ethers } = require('ethers');

/**
 * BLNK Lite Analyzer - Fixed Version
 * WETH/USDC mismatch bug fix
 */

const CRITICAL_PATTERNS = {
  mintable: ['40c10f19', 'a0712d68'],
  blacklist: ['e47d606b', 'f9f92be4'],
  upgradeable: ['3659cfe6', '5c60da1b'],
  pausable: ['8456cb59', '5c975abb'],
  suspicious: ['0a3b0a4f', '9dc29fac']
};

// Fixed: Correct USDC address
const SAFE_CONTRACTS = new Set([
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC (corrected)
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
]);

class LiteAnalyzer {
  constructor(rpcUrl = 'https://eth.llamarpc.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.requestCount = 0;
  }

  async gateCheck(contractAddress) {
    const startTime = Date.now();
    
    try {
      // Fixed: Normalize address properly
      const normalizedAddr = contractAddress.toLowerCase().trim();
      
      // Check whitelist first
      if (SAFE_CONTRACTS.has(normalizedAddr)) {
        return {
          decision: 'PASS',
          riskScore: 10,
          riskLevel: 'SAFE',
          confidence: 0.95,
          reason: 'Known safe contract (whitelist)',
          checks: { whitelist: true },
          isWhitelisted: true,
          latencyMs: Date.now() - startTime,
          rpcCalls: 0
        };
      }

      // Single RPC call
      this.requestCount++;
      const code = await this.provider.getCode(contractAddress);
      
      if (code === '0x') {
        return {
          decision: 'BLOCK',
          riskScore: 100,
          riskLevel: 'CRITICAL',
          confidence: 1.0,
          reason: 'Not a contract (EOA)',
          checks: { isContract: false },
          isWhitelisted: false,
          latencyMs: Date.now() - startTime,
          rpcCalls: 1
        };
      }

      // Pattern matching
      const bytecode = code.toLowerCase();
      const detected = this.scanPatterns(bytecode);
      const score = this.calculateScore(detected);
      
      // Decision logic
      if (detected.mintable || detected.suspicious) {
        return {
          decision: 'BLOCK',
          riskScore: score,
          riskLevel: 'CRITICAL',
          confidence: 0.85,
          reason: 'Critical patterns: ' + Object.keys(detected).join(', '),
          checks: detected,
          isWhitelisted: false,
          latencyMs: Date.now() - startTime,
          rpcCalls: 1
        };
      }
      
      if (detected.blacklist || detected.upgradeable) {
        return {
          decision: 'WARN',
          riskScore: score,
          riskLevel: 'MEDIUM',
          confidence: 0.75,
          reason: 'Caution patterns: ' + Object.keys(detected).join(', '),
          checks: detected,
          isWhitelisted: false,
          latencyMs: Date.now() - startTime,
          rpcCalls: 1
        };
      }

      return {
        decision: 'PASS',
        riskScore: score,
        riskLevel: 'LOW',
        confidence: 0.9,
        reason: 'No critical patterns detected',
        checks: detected,
        isWhitelisted: false,
        latencyMs: Date.now() - startTime,
        rpcCalls: 1
      };
      
    } catch (error) {
      return {
        decision: 'BLOCK',
        riskScore: 100,
        riskLevel: 'CRITICAL',
        confidence: 1.0,
        reason: 'RPC error: ' + error.message,
        checks: {},
        isWhitelisted: false,
        latencyMs: Date.now() - startTime,
        rpcCalls: 1,
        error: error.message
      };
    }
  }

  scanPatterns(bytecode) {
    const detected = {};
    
    for (const [category, signatures] of Object.entries(CRITICAL_PATTERNS)) {
      const found = signatures.filter(sig => bytecode.includes(sig));
      if (found.length > 0) {
        detected[category] = true;
      }
    }
    
    return detected;
  }

  calculateScore(detected) {
    let score = 10;
    
    if (detected.mintable) score += 40;
    if (detected.suspicious) score += 35;
    if (detected.blacklist) score += 25;
    if (detected.upgradeable) score += 15;
    if (detected.pausable) score += 10;
    
    return Math.min(100, score);
  }

  getStats() {
    return {
      totalRequests: this.requestCount,
      avgLatencyMs: null
    };
  }
}

module.exports = { LiteAnalyzer, SAFE_CONTRACTS };
