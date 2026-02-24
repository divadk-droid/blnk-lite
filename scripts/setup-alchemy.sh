#!/bin/bash
# Alchemy API Key Setup Script

echo "🔧 Alchemy API Key Setup"
echo "========================"
echo ""

# Check if API key is already set
if [ -n "$ALCHEMY_API_KEY" ]; then
    echo "✅ ALCHEMY_API_KEY is already set"
    echo "   Key: ${ALCHEMY_API_KEY:0:10}..."
else
    echo "❌ ALCHEMY_API_KEY not set"
    echo ""
    echo "📋 Setup Instructions:"
    echo ""
    echo "1. Go to https://dashboard.alchemy.com"
    echo "2. Create new app:"
    echo "   - Name: BLNK Risk Gate"
    echo "   - Chain: Base"
    echo "   - Network: Base Mainnet"
    echo ""
    echo "3. Copy API Key"
    echo ""
    echo "4. Set environment variable:"
    echo "   export ALCHEMY_API_KEY=your_api_key_here"
    echo ""
    echo "5. For testnet, also create:"
    echo "   - Chain: Base"
    echo "   - Network: Base Sepolia"
    echo "   - Copy Sepolia API Key"
    echo "   export ALCHEMY_SEPOLIA_KEY=your_sepolia_key"
    echo ""
fi

echo ""
echo "🔍 Checking other required environment variables..."
echo ""

# Check TESTNET_DEPLOYER_KEY
if [ -n "$TESTNET_DEPLOYER_KEY" ]; then
    echo "✅ TESTNET_DEPLOYER_KEY is set"
else
    echo "❌ TESTNET_DEPLOYER_KEY not set"
    echo "   Run: export TESTNET_DEPLOYER_KEY=0x..."
fi

# Check BASE_SEPOLIA_RPC
if [ -n "$BASE_SEPOLIA_RPC" ]; then
    echo "✅ BASE_SEPOLIA_RPC is set"
else
    echo "⚠️  BASE_SEPOLIA_RPC not set (optional)"
    echo "   Will use: https://sepolia.base.org"
fi

echo ""
echo "📋 Quick Setup Commands:"
echo "========================"
echo ""
echo "# Add to ~/.bashrc or ~/.zshrc:"
echo "export ALCHEMY_API_KEY=your_mainnet_key"
echo "export ALCHEMY_SEPOLIA_KEY=your_sepolia_key"
echo "export TESTNET_DEPLOYER_KEY=your_private_key"
echo ""
echo "# Then reload:"
echo "source ~/.bashrc  # or source ~/.zshrc"
echo ""

# If all keys are set, show next steps
if [ -n "$ALCHEMY_API_KEY" ] && [ -n "$TESTNET_DEPLOYER_KEY" ]; then
    echo "🎉 All keys are set!"
    echo ""
    echo "Next steps:"
    echo "1. Get Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia"
    echo "2. Run: ./deploy-testnet.sh"
    echo "3. Or: npm run check:sepolia"
fi
