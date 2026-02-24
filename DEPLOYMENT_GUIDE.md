# BLNK Token Base Network Deployment Guide

## Prerequisites

### 1. Environment Setup

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Environment Variables

Create `.env` file:

```bash
# Base Network RPC
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deployer private key (keep secret!)
DEPLOYER_PRIVATE_KEY=0x...

# Allocation addresses
ISSUER_ADDRESS=0x...
TEAM_ADDRESS=0x...
MARKETING_ADDRESS=0x...
COMMUNITY_ADDRESS=0x...
TREASURY_ADDRESS=0x...

# Optional: For verification
BASESCAN_API_KEY=...
```

## Deployment Steps

### Step 1: Compile Contracts

```bash
cd contracts
forge build
```

### Step 2: Test on Base Sepolia (Optional but Recommended)

```bash
# Get Sepolia ETH from faucet: https://www.alchemy.com/faucets/base-sepolia

# Deploy to testnet
forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify \
  -vvvv
```

### Step 3: Deploy to Base Mainnet

```bash
# Run deployment script
node scripts/deploy-base.js

# Or use Foundry
forge script script/Deploy.s.sol \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### Step 4: Verify Contracts

```bash
# Verify BLNKToken
forge verify-contract \
  --chain-id 8453 \
  --watch \
  CONTRACT_ADDRESS \
  BLNKToken

# Verify BlnkPaymentGate
forge verify-contract \
  --chain-id 8453 \
  --watch \
  CONTRACT_ADDRESS \
  BlnkPaymentGate
```

## Post-Deployment

### 1. Add Liquidity to Uniswap V3

- Pool: BLNK/WETH
- Fee tier: 0.3%
- Initial liquidity: 20M BLNK + 10 ETH (2% of supply)

### 2. Update Backend Configuration

```bash
# .env
PAYMENT_GATE_ADDRESS=0x...
BLNK_TOKEN_ADDRESS=0x...
BASE_RPC_URL=https://mainnet.base.org
```

### 3. Test Integration

```bash
# Test staking
node scripts/test-staking.js

# Test payment
node scripts/test-payment.js
```

## Contract Addresses (After Deployment)

| Contract | Address | BaseScan |
|----------|---------|----------|
| BLNKToken | 0x... | [View](https://basescan.org/address/0x...) |
| BlnkPaymentGate | 0x... | [View](https://basescan.org/address/0x...) |

## Gas Estimates

| Operation | Gas Estimate | Cost (at 0.1 gwei) |
|-----------|-------------|-------------------|
| Deploy BLNKToken | 3,000,000 | ~0.003 ETH |
| Deploy PaymentGate | 2,500,000 | ~0.0025 ETH |
| Stake | 150,000 | ~0.000015 ETH |
| Pay for API | 100,000 | ~0.00001 ETH |

## Security Checklist

- [ ] Deployer key is secure (use hardware wallet)
- [ ] All allocation addresses are correct
- [ ] Contracts verified on BaseScan
- [ ] Liquidity added and locked
- [ ] Backend updated with new addresses
- [ ] Monitoring alerts configured

## Support

- Base Network Docs: https://docs.base.org
- BaseScan: https://basescan.org
- BLNK Discord: https://discord.gg/blnk
