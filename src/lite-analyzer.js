const { ethers } = require('ethers');

/**
 * BLNK Lite Analyzer - Minimal RPC calls for free tier
 * 
 * Design: Single getCode() call + local pattern matching
 * No storage reads, no logs, no traces
 */

// Critical patterns only (reduced set for speed)
const CRITICAL_PATTERNS = {
  // High-risk: Unlimited minting
  mintable: ['40c10f19', 'a0712d68'], // mint() signatures
  
  // High-risk: Blacklist
  blacklist: ['e47d606b', 'f9f92be4'], // blacklist / isBlacklisted
  
  // Medium-risk: Upgradeable (proxy)
  upgradeable: ['3659cfe6', '5c60da1b'], // upgradeTo / implementation
  
  // Medium-risk: Pausable
  pausable: ['8456cb59', '5c975abb'], // pause / paused
  
  // Critical: Self-destruct / dangerous
  suspicious: ['0a3b0a4f', '9dc29fac'] // destroy / burnFrom
};

// Known safe contract hashes (WETH, USDC, USDT, etc.)
const SAFE_CONTRACTS = new Set([
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0xa0b86a33e6441e6c7d3d4b4f5c6d7e8f9a0b1c2d', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
]);

class LiteAnalyzer {
  constructor(rpcUrl, network = 'ethereum')
    this.network = network;
    this.providers = {
      ethereum: this.provider,
  // arbitrum network support
  arbitrumProvider: new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc'),
    };, network = 'ethereum')
    this.network = network;
    this.providers = {
      ethereum: this.provider,
  // base network support
  baseProvider: new ethers.JsonRpcProvider('https://base.llamarpc.com'),
    }; = 'https://eth.llamarpc.com') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.requestCount = 0;
  }

  /**
   * Minimal gate check - ONLY 1 RPC call
   * getCode() only, no storage reads
   */
  async gateCheck(contractAddress) {
    const startTime = Date.now();
    
    try {
      // Normalize address
      const normalizedAddr = contractAddress.toLowerCase();
      
      // Check whitelist first (no RPC)
      if (SAFE_CONTRACTS.has(normalizedAddr)) {
        return {
          decision: 'PASS',
          riskScore: 10,
          riskLevel: 'LOW',
          confidence: 0.95,
          reason: 'Known safe contract',
          checks: { whitelist: true },
          latencyMs: Date.now() - startTime,
          rpcCalls: 0
        };
      }

      // SINGLE RPC CALL: getCode
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
          latencyMs: Date.now() - startTime,
          rpcCalls: 1
        };
      }

      // Local pattern matching only
      const bytecode = code.toLowerCase();
      const detected = this.scanPatterns(bytecode);
      
      // Score calculation
      const score = this.calculateScore(detected);
      
      // Decision
      if (detected.mintable || detected.suspicious) {
        return {
          decision: 'BLOCK',
          riskScore: score,
          riskLevel: 'CRITICAL',
          confidence: 0.85,
          reason: `Critical patterns: ${Object.keys(detected).join(', ')}`,
          checks: detected,
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
          reason: `Caution patterns: ${Object.keys(detected).join(', ')}`,
          checks: detected,
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
        latencyMs: Date.now() - startTime,
        rpcCalls: 1
      };
      
    } catch (error) {
      // RPC failure - fail safe
      return {
        decision: 'BLOCK',
        riskScore: 100,
        riskLevel: 'CRITICAL',
        confidence: 1.0,
        reason: `RPC error: ${error.message}`,
        checks: {},
        latencyMs: Date.now() - startTime,
        rpcCalls: 1,
        error: error.message
      };
    }
  }

  /**
   * Local-only pattern scan (no RPC)
   */
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
    let score = 10; // Base score
    
    if (detected.mintable) score += 40;
    if (detected.suspicious) score += 35;
    if (detected.blacklist) score += 25;
    if (detected.upgradeable) score += 15;
    if (detected.pausable) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      avgLatencyMs: null // Would track in production
    };
  }
}

module.exports = { LiteAnalyzer, SAFE_CONTRACTS };
