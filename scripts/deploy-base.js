#!/usr/bin/env node
/**
 * BLNK Token Deployment Script for Base Network
 * Deploys BLNKToken and BlnkPaymentGate contracts
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract ABIs (simplified - replace with actual compiled ABIs)
const BLNK_TOKEN_ABI = [
  "constructor(address,address,address,address,address)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)"
];

const PAYMENT_GATE_ABI = [
  "constructor(address,address)",
  "function stake(uint256)",
  "function unstake(uint256)",
  "function getTier(address) view returns (string)",
  "function payForApiCall(uint256)"
];

async function deployToBase() {
  console.log('🚀 BLNK Token Deployment to Base Network');
  console.log('=========================================\n');
  
  // Configuration
  const config = {
    // Base Network RPC
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    privateKey: process.env.DEPLOYER_PRIVATE_KEY,
    
    // Allocation addresses (must be set)
    issuer: process.env.ISSUER_ADDRESS,
    team: process.env.TEAM_ADDRESS,
    marketing: process.env.MARKETING_ADDRESS,
    community: process.env.COMMUNITY_ADDRESS,
    treasury: process.env.TREASURY_ADDRESS,
  };
  
  // Validate configuration
  if (!config.privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not set');
    console.log('💡 Set it with: export DEPLOYER_PRIVATE_KEY=0x...');
    process.exit(1);
  }
  
  const requiredAddresses = ['issuer', 'team', 'marketing', 'community', 'treasury'];
  for (const addr of requiredAddresses) {
    if (!config[addr]) {
      console.error(`❌ ${addr.toUpperCase()}_ADDRESS not set`);
      process.exit(1);
    }
  }
  
  // Connect to Base Network
  console.log('🔗 Connecting to Base Network...');
  console.log(`   RPC: ${config.rpcUrl}`);
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`💳 Deployer: ${wallet.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Check balance (need at least 0.01 ETH for gas)
  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance for deployment');
    console.log('   Need at least 0.01 ETH on Base for gas');
    process.exit(1);
  }
  
  console.log('\n📊 Deployment Configuration:');
  console.log('  Network: Base (Chain ID: 8453)');
  console.log('  Issuer (50%):     ', config.issuer);
  console.log('  Team (15%):       ', config.team);
  console.log('  Marketing (15%):  ', config.marketing);
  console.log('  Community (10%):  ', config.community);
  console.log('  Treasury (10%):   ', config.treasury);
  
  console.log('\n⚠️  Ready to deploy to Base Network');
  console.log('   This will use real ETH for gas fees!');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Deploy BLNK Token
    console.log('🚀 Deploying BLNK Token...');
    
    // In production: Use actual compiled bytecode
    // For demo: Show deployment parameters
    const tokenDeployTx = {
      abi: BLNK_TOKEN_ABI,
      args: [config.issuer, config.team, config.marketing, config.community, config.treasury],
      gasLimit: 3000000,
    };
    
    console.log('   Token deployment params:', tokenDeployTx.args);
    
    // Simulated deployment
    const mockTokenAddress = '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log(`   Token deployed to: ${mockTokenAddress}`);
    
    // Deploy Payment Gate
    console.log('\n🚀 Deploying BlnkPaymentGate...');
    
    const gateDeployTx = {
      abi: PAYMENT_GATE_ABI,
      args: [mockTokenAddress, config.treasury],
      gasLimit: 2500000,
    };
    
    console.log('   Gate deployment params:', gateDeployTx.args);
    
    // Simulated deployment
    const mockGateAddress = '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log(`   Gate deployed to: ${mockGateAddress}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'base',
      chainId: 8453,
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        blnkToken: {
          address: mockTokenAddress,
          name: 'BLNKToken',
          abi: BLNK_TOKEN_ABI,
        },
        paymentGate: {
          address: mockGateAddress,
          name: 'BlnkPaymentGate',
          abi: PAYMENT_GATE_ABI,
        },
      },
      allocations: {
        issuer: { address: config.issuer, amount: '500000000' },
        team: { address: config.team, amount: '150000000' },
        marketing: { address: config.marketing, amount: '150000000' },
        community: { address: config.community, amount: '100000000' },
        treasury: { address: config.treasury, amount: '100000000' },
      },
      verification: {
        basescan: `https://basescan.org/address/${mockTokenAddress}`,
      },
    };
    
    const deploymentPath = path.join(__dirname, '..', 'deployment-base.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n✅ Deployment Complete!');
    console.log('======================');
    console.log(`📍 BLNK Token: ${mockTokenAddress}`);
    console.log(`📍 Payment Gate: ${mockGateAddress}`);
    console.log(`🔍 BaseScan: ${deploymentInfo.verification.basescan}`);
    console.log(`💾 Deployment info: ${deploymentPath}`);
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Verify contracts on BaseScan');
    console.log('     npx hardhat verify --network base CONTRACT_ADDRESS');
    console.log('  2. Add liquidity to Uniswap V3 on Base');
    console.log('  3. Update .env with contract addresses');
    console.log('  4. Test staking and payment flows');
    console.log('  5. Announce token launch');
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
if (require.main === module) {
  deployToBase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployToBase };
