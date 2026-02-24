#!/bin/bash
# BLNK Environment Setup Script
# Run this after getting Alchemy API keys

echo "🔧 BLNK Environment Setup"
echo "========================="
echo ""

# Test Alchemy Ethereum Mainnet API
echo "🧪 Testing Alchemy Ethereum Mainnet API..."
ETH_RESPONSE=$(curl -s https://eth-mainnet.g.alchemy.com/v2/xf7x0knEVtg899MjCvU_y \
  --request POST \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber"}')

if echo "$ETH_RESPONSE" | grep -q "result"; then
    BLOCK_NUMBER=$(echo "$ETH_RESPONSE" | grep -o '"result":"0x[^"]*' | cut -d'"' -f4)
    echo "✅ Ethereum Mainnet API is working!"
    echo "   Current block: $BLOCK_NUMBER"
else
    echo "❌ Ethereum Mainnet API failed"
    echo "   Response: $ETH_RESPONSE"
fi

echo ""

# Check if Base Sepolia key is set
if [ -n "$ALCHEMY_SEPOLIA_KEY" ]; then
    echo "🧪 Testing Alchemy Base Sepolia API..."
    SEPOLIA_RESPONSE=$(curl -s "https://base-sepolia.g.alchemy.com/v2/$ALCHEMY_SEPOLIA_KEY" \
      --request POST \
      --header 'accept: application/json' \
      --header 'content-type: application/json' \
      --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber"}')
    
    if echo "$SEPOLIA_RESPONSE" | grep -q "result"; then
        echo "✅ Base Sepolia API is working!"
    else
        echo "❌ Base Sepolia API failed"
        echo "   Make sure ALCHEMY_SEPOLIA_KEY is set correctly"
    fi
else
    echo "⚠️  ALCHEMY_SEPOLIA_KEY not set"
    echo "   Please set it: export ALCHEMY_SEPOLIA_KEY=your_sepolia_key"
fi

echo ""
echo "📋 Environment Variables Status:"
echo "================================="

# Check all required variables
VARS=("ALCHEMY_API_KEY" "ALCHEMY_SEPOLIA_KEY" "TESTNET_DEPLOYER_KEY")

for var in "${VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var is set"
    else
        echo "❌ $var is NOT set"
    fi
done

echo ""
echo "📝 Setup Instructions:"
echo "======================"
echo ""
echo "1. Add these lines to your ~/.bashrc or ~/.zshrc:"
echo ""
echo "   export ALCHEMY_API_KEY=xf7x0knEVtg899MjCvU_y"
echo "   export ALCHEMY_SEPOLIA_KEY=your_sepolia_key_here"
echo "   export TESTNET_DEPLOYER_KEY=your_private_key_here"
echo ""
echo "2. Reload your shell:"
echo "   source ~/.bashrc  # or source ~/.zshrc"
echo ""
echo "3. Get Sepolia ETH:"
echo "   https://www.alchemy.com/faucets/base-sepolia"
echo ""
echo "4. Deploy to testnet:"
echo "   ./deploy-testnet.sh"
echo ""

# Check if all required vars are set
if [ -n "$ALCHEMY_SEPOLIA_KEY" ] && [ -n "$TESTNET_DEPLOYER_KEY" ]; then
    echo "🎉 All required variables are set!"
    echo "   Ready for testnet deployment!"
fi
