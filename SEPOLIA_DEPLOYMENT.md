# Base Sepolia Testnet Deployment Guide

## Prerequisites

### 1. Get Sepolia ETH

1. Visit: https://www.alchemy.com/faucets/base-sepolia
2. Connect your wallet
3. Request 0.5 Sepolia ETH
4. Wait for confirmation (usually instant)

### 2. Environment Setup

```bash
# Set environment variables
export BASE_SEPOLIA_RPC=https://sepolia.base.org
export TESTNET_DEPLOYER_KEY=0x...  # Your private key
export TESTNET_DEPLOYER_ADDRESS=0x...  # Your address

# Optional: Use same address for all allocations (testing)
export TESTNET_ISSUER=$TESTNET_DEPLOYER_ADDRESS
export TESTNET_TEAM=$TESTNET_DEPLOYER_ADDRESS
export TESTNET_MARKETING=$TESTNET_DEPLOYER_ADDRESS
export TESTNET_COMMUNITY=$TESTNET_DEPLOYER_ADDRESS
export TESTNET_TREASURY=$TESTNET_DEPLOYER_ADDRESS
```

## Deployment Steps

### Step 1: Deploy Contracts

```bash
# Run deployment script
node scripts/deploy-sepolia.js
```

Expected output:
```
🧪 BLNK Token Testnet Deployment
=================================

🔗 Connecting to Base Sepolia...
💳 Deployer: 0x...
💰 Balance: 0.5 ETH

📊 Testnet Deployment Configuration:
  Network: Base Sepolia (Chain ID: 84532)
  ...

🚀 Deploying BLNK Token...
   Token deployed to: 0x...
   Gas used: ~3,000,000

🚀 Deploying BlnkPaymentGate...
   Gate deployed to: 0x...
   Gas used: ~2,500,000

✅ Testnet Deployment Complete!
===============================
📍 BLNK Token: 0x...
📍 Payment Gate: 0x...
🔍 Sepolia BaseScan: https://sepolia.basescan.org/address/0x...
💾 Deployment info: deployment-sepolia.json
```

### Step 2: Verify Contracts

```bash
# Install hardhat-verify
npm install @nomicfoundation/hardhat-verify

# Verify BLNKToken
npx hardhat verify --network baseSepolia \
  TOKEN_ADDRESS \
  ISSUER_ADDRESS TEAM_ADDRESS MARKETING_ADDRESS COMMUNITY_ADDRESS TREASURY_ADDRESS

# Verify BlnkPaymentGate
npx hardhat verify --network baseSepolia \
  GATE_ADDRESS \
  TOKEN_ADDRESS TREASURY_ADDRESS
```

### Step 3: Run Tests

```bash
# Run full test suite
node scripts/test-sepolia.js
```

Expected output:
```
🚀 BLNK Testnet Test Suite
===========================

Testing on: Base Sepolia
...

🧪 Testing: Token Deployment
   ✅ PASSED

🧪 Testing: Total Supply Check
   ✅ PASSED

🧪 Testing: Staking Functionality
   ✅ PASSED

...

📊 Test Results
===============
✅ Passed: 8
❌ Failed: 0
📈 Success Rate: 100%

🎉 All tests passed! Ready for mainnet.
```

### Step 4: Manual Testing

#### Test Staking

```javascript
// Connect to testnet
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet(privateKey, provider);

// Load contracts
const token = new ethers.Contract(tokenAddress, tokenAbi, wallet);
const gate = new ethers.Contract(gateAddress, gateAbi, wallet);

// Approve and stake
await token.approve(gateAddress, ethers.parseEther('500'));
await gate.stake(ethers.parseEther('500'));

// Check tier
const tier = await gate.getTier(wallet.address);
console.log('Tier:', tier); // Should be "BASIC"
```

#### Test Payment

```javascript
// Pay for API calls
await token.approve(gateAddress, ethers.parseEther('100'));
await gate.payForApiCall(ethers.parseEther('100'));

// Check credits
const credits = await gate.getCredits(wallet.address);
console.log('Credits:', credits.toString()); // Should be 10000
```

#### Test Burn

```javascript
// Check burn stats
const stats = await gate.getStats();
console.log('Total Burned:', ethers.formatEther(stats.totalBurnedAmount));
```

### Step 5: Update Frontend

Edit `.env.testnet`:

```bash
NEXT_PUBLIC_API_URL=https://blnk-lite-production.up.railway.app
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BLNK_TOKEN=0x...  # Your testnet token address
NEXT_PUBLIC_PAYMENT_GATE=0x...  # Your testnet gate address
```

### Step 6: Invite Beta Testers

Create invite link:
```
🚀 BLNK Testnet Beta

Try our A2A Security Agent on Base Sepolia!

🔗 Dashboard: https://burn.blnk.io
📖 Docs: https://docs.blnk.io
💬 Support: https://discord.gg/blnk

Testnet Token: 0x...
Faucet: https://www.alchemy.com/faucets/base-sepolia

Please report any bugs! 🐛
```

## Verification Checklist

- [ ] Contracts deployed successfully
- [ ] Contracts verified on Sepolia BaseScan
- [ ] Staking works (all 4 tiers)
- [ ] Payment and burn works (50/50)
- [ ] API credits system works
- [ ] Events emitted correctly
- [ ] Frontend connects properly
- [ ] No console errors
- [ ] Mobile responsive

## Common Issues

### Issue: "Insufficient funds"
**Solution**: Get more Sepolia ETH from faucet

### Issue: "Contract verification failed"
**Solution**: Wait 5 minutes after deployment, then retry

### Issue: "Transaction reverted"
**Solution**: Check that you approved tokens before staking/paying

### Issue: "Cannot connect to network"
**Solution**: Check RPC URL, try alternative:
- https://sepolia.base.org
- https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

## Next Steps

After successful testnet deployment:

1. **Collect Feedback** (1-2 days)
   - Share with beta testers
   - Monitor Discord/Telegram
   - Fix reported issues

2. **Security Audit** (1-2 weeks)
   - Submit to Certik/Trail of Bits
   - Fix any findings

3. **Mainnet Deployment** (1 day)
   - Use production addresses
   - Deploy with real ETH
   - Add liquidity

## Resources

- Base Sepolia Explorer: https://sepolia.basescan.org
- Faucet: https://www.alchemy.com/faucets/base-sepolia
- Base Docs: https://docs.base.org
- BLNK Discord: https://discord.gg/blnk
