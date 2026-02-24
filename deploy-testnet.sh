#!/bin/bash
# BLNK Testnet Deployment Script
# Run this to deploy to Base Sepolia

echo "🚀 BLNK Testnet Deployment"
echo "=========================="
echo ""

# Check if TESTNET_DEPLOYER_KEY is set
if [ -z "$TESTNET_DEPLOYER_KEY" ]; then
    echo "❌ TESTNET_DEPLOYER_KEY not set"
    echo ""
    echo "📋 Setup Steps:"
    echo ""
    echo "1. Create a new wallet for testnet:"
    echo "   node -e \"const ethers = require('ethers'); console.log(ethers.Wallet.createRandom().privateKey);\""
    echo ""
    echo "2. Save the private key and set environment variable:"
    echo "   export TESTNET_DEPLOYER_KEY=0x..."
    echo ""
    echo "3. Get Sepolia ETH from faucet:"
    echo "   https://www.alchemy.com/faucets/base-sepolia"
    echo ""
    echo "4. Run this script again"
    echo ""
    exit 1
fi

# Check balance
echo "🔍 Checking Sepolia ETH balance..."
node scripts/check-sepolia.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Insufficient balance or connection error"
    echo "Please get Sepolia ETH from the faucet"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Compiling contracts..."
npx hardhat compile

echo ""
echo "🚀 Deploying to Base Sepolia..."
node scripts/deploy-sepolia.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🧪 Running tests..."
    node scripts/test-sepolia.js
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Verify contracts on Sepolia BaseScan"
    echo "2. Update frontend with testnet addresses"
    echo "3. Invite beta testers"
else
    echo ""
    echo "❌ Deployment failed"
    exit 1
fi
