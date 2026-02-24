# BLNK Token Liquidity Provision Guide

## Overview

This guide covers adding liquidity to Uniswap V3 on Base Network.

**Initial Liquidity Plan:**
- Pool: BLNK/WETH
- Amount: 20,000,000 BLNK + 10 WETH
- Initial Price: 1 WETH = 2,000,000 BLNK ($0.001 per BLNK)
- Fee Tier: 0.3% (3000)

## Prerequisites

1. **BLNK Tokens** - 20M BLNK in deployer wallet
2. **WETH** - 10 WETH (or 10 ETH which will be wrapped)
3. **Gas** - 0.01 ETH for transaction fees

## Step-by-Step Guide

### Option 1: Using Etherscan (Recommended for beginners)

1. **Navigate to Contract**
   - Go to `https://basescan.org/address/{LIQUIDITY_MANAGER_ADDRESS}`
   - Connect your wallet (MetaMask with Base Network)

2. **Approve BLNK Tokens**
   - Go to BLNK token contract on Etherscan
   - Call `approve` function:
     - spender: LiquidityManager address
     - amount: 20000000000000000000000000 (20M with 18 decimals)

3. **Add Liquidity**
   - Call `addInitialLiquidity` function:
     - blnkAmount: 20000000000000000000000000
     - ethAmount: 10000000000000000000 (10 ETH)
     - feeTier: 3000
   - Send 10 ETH with the transaction

### Option 2: Using Command Line

```bash
# Set environment variables
export LIQUIDITY_MANAGER=0x...
export BLNK_TOKEN=0x...
export PRIVATE_KEY=0x...
export BASE_RPC=https://mainnet.base.org

# Run liquidity addition script
node scripts/add-liquidity.js
```

### Option 3: Using Foundry Script

```solidity
// script/AddLiquidity.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/BLNKLiquidityManager.sol";

contract AddLiquidityScript is Script {
    function run() external {
        vm.startBroadcast();
        
        BLNKLiquidityManager manager = BLNKLiquidityManager(
            0x... // Liquidity manager address
        );
        
        // Approve BLNK
        IERC20 blnk = IERC20(0x...); // BLNK token address
        blnk.approve(address(manager), 20_000_000 * 1e18);
        
        // Add liquidity
        manager.addInitialLiquidity{value: 10 ether}(
            20_000_000 * 1e18, // 20M BLNK
            10 ether,          // 10 ETH
            3000               // 0.3% fee tier
        );
        
        vm.stopBroadcast();
    }
}
```

Run with:
```bash
forge script script/AddLiquidity.s.sol \
  --rpc-url $BASE_RPC \
  --broadcast \
  -vvvv
```

## Verification

After adding liquidity:

1. **Check Pool on Uniswap**
   - Visit: `https://app.uniswap.org/explore/pools/base/{POOL_ADDRESS}`
   - Verify liquidity amounts

2. **Check Position**
   - Visit: `https://app.uniswap.org/pool/{TOKEN_ID}`
   - View your LP position

3. **Verify Metrics**
```bash
node scripts/token-metrics.js print
```

## Fee Tier Selection

| Tier | Fee | Best For |
|------|-----|----------|
| 0.05% | 500 | Stable pairs (USDC/USDT) |
| 0.3% | 3000 | **Standard pairs (BLNK/WETH)** |
| 1% | 10000 | Exotic pairs |

## Concentrated Liquidity (Advanced)

Instead of full range (-∞ to +∞), consider:

```solidity
// Narrow range for better capital efficiency
int24 tickLower = -276420; // ~$0.0005
int24 tickUpper = -138210; // ~$0.002

// This concentrates liquidity around $0.001
```

## Risks & Considerations

1. **Impermanent Loss** - If BLNK price moves significantly vs ETH
2. **IL Protection** - Consider adding IL protection mechanism
3. **Liquidity Lock** - Consider locking LP tokens for trust
4. **Rebalancing** - Plan for periodic rebalancing

## Post-Liquidity Steps

1. **Verify on DEX Aggregators**
   - 1inch
   - Matcha
   - Paraswap

2. **Update Documentation**
   - Add pool address to README
   - Update website with trading info

3. **Monitor**
   - Track volume
   - Watch for large price movements
   - Adjust liquidity if needed

## Emergency Procedures

### Remove Liquidity

```solidity
// In emergency, remove liquidity
function removeLiquidity(uint256 tokenId) external onlyOwner {
    // Implementation depends on position manager
}
```

### Pause Trading

If critical issue discovered:
1. Communicate immediately
2. Consider removing liquidity temporarily
3. Fix issue
4. Re-add liquidity

## Support

- Uniswap Docs: https://docs.uniswap.org
- Base Network: https://docs.base.org
- BLNK Discord: https://discord.gg/blnk
