#!/usr/bin/env node
/**
 * Sepolia ETH Check & Faucet Guide
 */

const { ethers } = require('ethers');

async function checkSepoliaBalance() {
  console.log('🧪 Sepolia ETH Check');
  console.log('====================\n');
  
  const privateKey = process.env.TESTNET_DEPLOYER_KEY;
  
  if (!privateKey) {
    console.log('❌ TESTNET_DEPLOYER_KEY not set\n');
    console.log('📋 Setup Instructions:');
    console.log('1. Create new wallet for testnet');
    console.log('2. Save private key securely');
    console.log('3. Set environment variable:\n');
    console.log('   export TESTNET_DEPLOYER_KEY=0x...\n');
    console.log('4. Get Sepolia ETH from:');
    console.log('   https://www.alchemy.com/faucets/base-sepolia\n');
    return;
  }
  
  try {
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const balance = await provider.getBalance(wallet.address);
    const ethBalance = ethers.formatEther(balance);
    
    console.log(`💳 Address: ${wallet.address}`);
    console.log(`💰 Balance: ${ethBalance} ETH\n`);
    
    if (balance === 0n) {
      console.log('❌ No Sepolia ETH found\n');
      console.log('📋 Get ETH from:');
      console.log('   https://www.alchemy.com/faucets/base-sepolia\n');
      console.log('   Steps:');
      console.log('   1. Connect wallet');
      console.log('   2. Complete captcha');
      console.log('   3. Request 0.5 ETH');
      console.log('   4. Wait 1-2 minutes\n');
    } else if (parseFloat(ethBalance) < 0.1) {
      console.log('⚠️  Low balance (< 0.1 ETH)');
      console.log('   Recommended: 0.5 ETH for deployment\n');
    } else {
      console.log('✅ Sufficient balance for deployment\n');
      console.log('🚀 Ready to deploy!\n');
      console.log('   Run: npm run deploy:sepolia\n');
    }
    
    // Save address for reference
    console.log('📋 Environment Setup:');
    console.log(`   export TESTNET_DEPLOYER_ADDRESS=${wallet.address}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSepoliaBalance();
