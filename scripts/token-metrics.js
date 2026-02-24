#!/usr/bin/env node
/**
 * BLNK Token Metrics Tracker
 * Monitors token metrics and sends alerts
 */

const { ethers } = require('ethers');

class TokenMetrics {
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.BASE_RPC_URL;
    this.tokenAddress = config.tokenAddress || process.env.BLNK_TOKEN_ADDRESS;
    this.paymentGateAddress = config.paymentGateAddress || process.env.PAYMENT_GATE_ADDRESS;
    
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    
    // ABI fragments
    this.tokenAbi = [
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ];
    
    this.gateAbi = [
      'function totalStaked() view returns (uint256)',
      'function totalBurned() view returns (uint256)',
      'function totalPaidToTreasury() view returns (uint256)',
      'function stakedBalances(address) view returns (uint256)'
    ];
    
    this.token = new ethers.Contract(this.tokenAddress, this.tokenAbi, this.provider);
    this.gate = new ethers.Contract(this.paymentGateAddress, this.gateAbi, this.provider);
  }
  
  async getMetrics() {
    try {
      const [
        totalSupply,
        totalStaked,
        totalBurned,
        totalTreasury
      ] = await Promise.all([
        this.token.totalSupply(),
        this.gate.totalStaked(),
        this.gate.totalBurned(),
        this.gate.totalPaidToTreasury()
      ]);
      
      const decimals = await this.token.decimals();
      const divisor = BigInt(10) ** BigInt(decimals);
      
      return {
        timestamp: new Date().toISOString(),
        totalSupply: Number(totalSupply / divisor),
        totalStaked: Number(totalStaked / divisor),
        totalBurned: Number(totalBurned / divisor),
        totalTreasury: Number(totalTreasury / divisor),
        circulatingSupply: Number((totalSupply - totalStaked - totalBurned) / divisor),
        burnPercentage: Number(totalBurned * 10000n / totalSupply) / 100,
        stakedPercentage: Number(totalStaked * 10000n / totalSupply) / 100
      };
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }
  
  async printMetrics() {
    const metrics = await this.getMetrics();
    
    console.log('\n📊 BLNK Token Metrics');
    console.log('====================');
    console.log(`Total Supply:      ${metrics.totalSupply.toLocaleString()} BLNK`);
    console.log(`Circulating:       ${metrics.circulatingSupply.toLocaleString()} BLNK`);
    console.log(`Total Staked:      ${metrics.totalStaked.toLocaleString()} BLNK (${metrics.stakedPercentage}%)`);
    console.log(`Total Burned:      ${metrics.totalBurned.toLocaleString()} BLNK (${metrics.burnPercentage}%)`);
    console.log(`Treasury:          ${metrics.totalTreasury.toLocaleString()} BLNK`);
    console.log(`Timestamp:         ${metrics.timestamp}`);
    console.log('');
    
    return metrics;
  }
  
  async saveMetrics() {
    const metrics = await this.getMetrics();
    
    // Save to file
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'metrics.json');
    
    // Read existing data
    let history = [];
    if (fs.existsSync(filePath)) {
      history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    // Add new entry
    history.push(metrics);
    
    // Keep last 1000 entries
    if (history.length > 1000) {
      history = history.slice(-1000);
    }
    
    // Save
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    
    console.log(`💾 Metrics saved to ${filePath}`);
    return metrics;
  }
  
  startMonitoring(intervalMinutes = 60) {
    console.log(`🔍 Starting metrics monitoring (every ${intervalMinutes} minutes)`);
    
    // Run immediately
    this.saveMetrics();
    
    // Schedule periodic updates
    setInterval(() => {
      this.saveMetrics();
    }, intervalMinutes * 60 * 1000);
  }
}

// CLI usage
if (require.main === module) {
  const metrics = new TokenMetrics();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'print':
      metrics.printMetrics();
      break;
    case 'save':
      metrics.saveMetrics();
      break;
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 60;
      metrics.startMonitoring(interval);
      break;
    default:
      console.log('Usage:');
      console.log('  node token-metrics.js print     - Print current metrics');
      console.log('  node token-metrics.js save      - Save metrics to file');
      console.log('  node token-metrics.js monitor [interval_minutes]');
      process.exit(0);
  }
}

module.exports = { TokenMetrics };
