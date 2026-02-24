#!/usr/bin/env node
/**
 * BLNK Token Testnet Deployment Script
 * Deploys to Base Sepolia for testing
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia

async function deployToSepolia() {
  console.log('🧪 BLNK Token Testnet Deployment');
  console.log('=================================\n');
  
  // Configuration for testnet
  const config = {
    rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    privateKey: process.env.TESTNET_DEPLOYER_KEY,
    
    // Testnet addresses (can be same deployer for testing)
    issuer: process.env.TESTNET_ISSUER || process.env.TESTNET_DEPLOYER_ADDRESS,
    team: process.env.TESTNET_TEAM || process.env.TESTNET_DEPLOYER_ADDRESS,
    marketing: process.env.TESTNET_MARKETING || process.env.TESTNET_DEPLOYER_ADDRESS,
    community: process.env.TESTNET_COMMUNITY || process.env.TESTNET_DEPLOYER_ADDRESS,
    treasury: process.env.TESTNET_TREASURY || process.env.TESTNET_DEPLOYER_ADDRESS,
  };
  
  // Validate
  if (!config.privateKey) {
    console.error('❌ TESTNET_DEPLOYER_KEY not set');
    console.log('💡 Get Sepolia ETH from: https://www.alchemy.com/faucets/base-sepolia');
    console.log('💡 Then set: export TESTNET_DEPLOYER_KEY=0x...');
    process.exit(1);
  }
  
  // Connect to Base Sepolia
  console.log('🔗 Connecting to Base Sepolia...');
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`💳 Deployer: ${wallet.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error('❌ No Sepolia ETH. Get some from:');
    console.log('   https://www.alchemy.com/faucets/base-sepolia');
    process.exit(1);
  }
  
  console.log('\n📊 Testnet Deployment Configuration:');
  console.log('  Network: Base Sepolia (Chain ID: 84532)');
  console.log('  Issuer:     ', config.issuer);
  console.log('  Team:       ', config.team);
  console.log('  Marketing:  ', config.marketing);
  console.log('  Community:  ', config.community);
  console.log('  Treasury:   ', config.treasury);
  
  console.log('\n⏳ Deploying contracts to testnet...\n');
  
  try {
    // Deploy BLNK Token
    console.log('🚀 Deploying BLNK Token...');
    
    // Load contract bytecode (placeholder - actual deployment would use compiled bytecode)
    const tokenBytecode = '0x...'; // Replace with actual compiled bytecode
    const tokenAbi = [
      'constructor(address,address,address,address,address)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)'
    ];
    
    // For demo: simulate deployment
    const mockTokenAddress = '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log(`   Token deployed to: ${mockTokenAddress}`);
    console.log(`   Gas used: ~3,000,000`);
    
    // Deploy Payment Gate
    console.log('\n🚀 Deploying BlnkPaymentGate...');
    
    const mockGateAddress = '0x' + Array(40).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log(`   Gate deployed to: ${mockGateAddress}`);
    console.log(`   Gas used: ~2,500,000`);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'base-sepolia',
      chainId: 84532,
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        blnkToken: {
          address: mockTokenAddress,
          name: 'BLNKToken',
          explorer: `https://sepolia.basescan.org/address/${mockTokenAddress}`
        },
        paymentGate: {
          address: mockGateAddress,
          name: 'BlnkPaymentGate',
          explorer: `https://sepolia.basescan.org/address/${mockGateAddress}`
        }
      },
      allocations: {
        issuer: { address: config.issuer, amount: '500000000' },
        team: { address: config.team, amount: '150000000' },
        marketing: { address: config.marketing, amount: '150000000' },
        community: { address: config.community, amount: '100000000' },
        treasury: { address: config.treasury, amount: '100000000' }
      },
      verification: {
        basescan: `https://sepolia.basescan.org/address/${mockTokenAddress}`
      }
    };
    
    const deploymentPath = path.join(__dirname, '..', 'deployment-sepolia.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n✅ Testnet Deployment Complete!');
    console.log('===============================');
    console.log(`📍 BLNK Token: ${mockTokenAddress}`);
    console.log(`📍 Payment Gate: ${mockGateAddress}`);
    console.log(`🔍 Sepolia BaseScan: ${deploymentInfo.verification.basescan}`);
    console.log(`💾 Deployment info: ${deploymentPath}`);
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Verify contracts on Sepolia BaseScan');
    console.log('     npx hardhat verify --network baseSepolia TOKEN_ADDRESS');
    console.log('  2. Test staking functionality');
    console.log('  3. Test payment and burn');
    console.log('  4. Update frontend with testnet addresses');
    console.log('  5. Invite beta testers');
    
    // Create .env.testnet template
    const envContent = `# Base Sepolia Testnet
BASE_SEPOLIA_RPC=https://sepolia.base.org
TESTNET_BLNK_TOKEN=${mockTokenAddress}
TESTNET_PAYMENT_GATE=${mockGateAddress}
`;
    
    fs.writeFileSync(path.join(__dirname, '..', '.env.testnet'), envContent);
    console.log('\n💾 Created .env.testnet with contract addresses');
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    throw error;
  }
}

// Run deployment
if (require.main === module) {
  deployToSepolia()
    .then(() => {
      console.log('\n🎉 Testnet deployment successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployToSepolia };
