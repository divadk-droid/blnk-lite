#!/bin/bash
# BLNK Testnet Deployment - Ready Check

echo "🚀 BLNK Testnet Deployment - Ready Check"
echo "=========================================="
echo ""

# Set environment variables for this session
export ALCHEMY_API_KEY="xf7x0knEVtg899MjCvU_y"
export ALCHEMY_SEPOLIA_KEY="xf7x0knEVtg899MjCvU_y"
export BASE_SEPOLIA_RPC="https://base-sepolia.g.alchemy.com/v2/xf7x0knEVtg899MjCvU_y"

echo "✅ Environment variables set for this session"
echo ""

# Test APIs
echo "🧪 Testing APIs..."
echo ""

# Test Base Sepolia
SEPOLIA_RESPONSE=$(curl -s "$BASE_SEPOLIA_RPC" \
  --request POST \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber"}')

if echo "$SEPOLIA_RESPONSE" | grep -q "result"; then
    BLOCK_HEX=$(echo "$SEPOLIA_RESPONSE" | grep -o '"result":"0x[^"]*' | cut -d'"' -f4)
    BLOCK_DEC=$(printf '%d' "$BLOCK_HEX")
    echo "✅ Base Sepolia API: Working"
    echo "   Current block: $BLOCK_DEC ($BLOCK_HEX)"
else
    echo "❌ Base Sepolia API: Failed"
fi

echo ""

# Check TESTNET_DEPLOYER_KEY
if [ -z "$TESTNET_DEPLOYER_KEY" ]; then
    echo "❌ TESTNET_DEPLOYER_KEY not set"
    echo ""
    echo "📋 To create a testnet wallet:"
    echo "   node -e \"const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);\""
    echo ""
    echo "📋 Then set it:"
    echo "   export TESTNET_DEPLOYER_KEY=0x..."
    echo ""
    exit 1
else
    echo "✅ TESTNET_DEPLOYER_KEY is set"
    
    # Get address from private key
    ADDRESS=$(node -e "const ethers = require('ethers'); const w = new ethers.Wallet('$TESTNET_DEPLOYER_KEY'); console.log(w.address);" 2>/dev/null)
    
    if [ -n "$ADDRESS" ]; then
        echo "   Address: $ADDRESS"
        
        # Check balance
        BALANCE_RESPONSE=$(curl -s "$BASE_SEPOLIA_RPC" \
          --request POST \
          --header 'accept: application/json' \
          --header 'content-type: application/json' \
          --data "{\"id\":1,\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADDRESS\",\"latest\"]}")
        
        BALANCE_HEX=$(echo "$BALANCE_RESPONSE" | grep -o '"result":"0x[^"]*' | cut -d'"' -f4)
        if [ -n "$BALANCE_HEX" ]; then
            BALANCE_DEC=$(printf '%d' "$BALANCE_HEX")
            BALANCE_ETH=$(echo "scale=6; $BALANCE_DEC / 1000000000000000000" | bc)
            echo "   Balance: $BALANCE_ETH ETH"
            
            if [ "$BALANCE_DEC" -eq 0 ]; then
                echo ""
                echo "❌ Insufficient balance"
                echo "   Get Sepolia ETH: https://www.alchemy.com/faucets/base-sepolia"
                exit 1
            else
                echo ""
                echo "🎉 Ready for deployment!"
                echo ""
                echo "Run: ./deploy-testnet.sh"
            fi
        fi
    fi
fi
