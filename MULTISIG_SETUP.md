# BLNK Treasury Multi-Sig Setup Guide

## Overview

Multi-signature wallet for BLNK treasury to ensure security and prevent single point of failure.

**Recommended:** Gnosis Safe on Base Network

## Setup Steps

### 1. Create Gnosis Safe

1. Visit: https://app.safe.global
2. Connect wallet (Base Network)
3. Click "Create new Safe"
4. Add owners (3-5 recommended):
   - CEO/Founder
   - CTO/Tech Lead
   - Advisor/Investor
   - Community Representative
   - Legal/Compliance

5. Set threshold: 3/5 signatures required

### 2. Safe Configuration

```
Safe Name: BLNK Treasury
Network: Base
Owners: 5
Threshold: 3
```

### 3. Treasury Allocation

| Purpose | Percentage | Multi-sig Required |
|---------|-----------|-------------------|
| Development | 20% | 2/5 |
| Marketing | 15% | 2/5 |
| LP Rewards | 30% | 3/5 |
| Emergency | 10% | 4/5 |
| Operations | 25% | 3/5 |

### 4. Smart Contract Integration

Update `BlnkPaymentGate.sol`:

```solidity
// Set treasury to multi-sig address
constructor(address _blnkToken, address _treasuryMultiSig) {
    require(_treasuryMultiSig != address(0), "Invalid treasury");
    // Verify it's a contract (multi-sig)
    require(_treasuryMultiSig.code.length > 0, "Must be contract");
    
    blnkToken = IERC20(_blnkToken);
    treasuryAddress = _treasuryMultiSig;
}
```

### 5. Transaction Policies

#### Standard Transactions (2/5)
- Monthly operations budget
- Regular payments
- Small marketing spends

#### Major Transactions (3/5)
- Large marketing campaigns
- Exchange listings
- Partnership deals

#### Critical Transactions (4/5)
- Emergency fund release
- Contract upgrades
- Treasury rebalancing

### 6. Emergency Procedures

#### Lost Key Recovery
1. Remaining owners vote to remove lost key
2. Add new owner with replacement key
3. Update threshold if needed

#### Compromised Key
1. Immediately freeze large transactions
2. Emergency meeting with all owners
3. Remove compromised key
4. Add new secure key

### 7. Monitoring

Set up alerts for:
- Any transaction > 100K BLNK
- Threshold changes
- Owner additions/removals
- Failed transactions

## Implementation

### Deploy Safe

```bash
# Using Safe CLI
npm install -g @safe-global/safe-cli

safe create \
  --network base \
  --owners 0x... 0x... 0x... 0x... 0x... \
  --threshold 3 \
  --name "BLNK Treasury"
```

### Update Contracts

```javascript
// deployment script
const treasuryMultiSig = "0x..."; // Safe address

const gate = await BlnkPaymentGate.deploy(
  tokenAddress,
  treasuryMultiSig  // Use multi-sig instead of EOA
);
```

### Verify Setup

```bash
# Check Safe configuration
safe info --network base --address 0x...

# Test small transaction
safe propose --to 0x... --value 0 --data 0x...
```

## Best Practices

1. **Hardware Wallets**: All owners use hardware wallets
2. **Geographic Distribution**: Owners in different locations
3. **Regular Rotation**: Change keys every 6-12 months
4. **Backup Plans**: Secure key backup procedures
5. **Documentation**: All transactions documented

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Owner 1 | | | |
| Owner 2 | | | |
| Owner 3 | | | |
| Owner 4 | | | |
| Owner 5 | | | |

---

**Setup Date:** _______________  
**Safe Address:** _______________  
**Verified by:** _______________
