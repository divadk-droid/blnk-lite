# BLNK Bug Bounty Program

## Program Overview

**Status:** Active  
**Platform:** Immunefi (recommended) or self-hosted  
**Total Pool:** $100,000 USD (in BLNK tokens)

## Scope

### In Scope

| Component | Severity | Max Bounty |
|-----------|----------|------------|
| BLNKToken.sol | Critical | $50,000 |
| BlnkPaymentGate.sol | Critical | $50,000 |
| Backend API | Critical | $25,000 |
| Frontend Dashboard | High | $10,000 |
| Documentation | Low | $500 |

### Out of Scope
- Already known issues
- Issues in dependencies (OpenZeppelin, etc.)
- Frontend UI/UX improvements
- Gas optimization suggestions
- Test code

## Severity Levels

### Critical ($10,000 - $50,000)
- Theft of funds
- Permanent freezing of funds
- Unauthorized minting
- Bypass of access control
- Governance attacks

### High ($5,000 - $10,000)
- Temporary freezing of funds
- Theft of yield/rewards
- Price manipulation
- Access control issues

### Medium ($1,000 - $5,000)
- DoS attacks
- Gas griefing
- Logic errors

### Low ($100 - $1,000)
- Best practice violations
- Informational issues
- Documentation errors

## Submission Process

### 1. Submit Report

Email: security@blnk.io

Subject: `[BUG BOUNTY] [SEVERITY] Brief Description`

Template:
```
## Summary
Brief description of the vulnerability

## Severity
Critical/High/Medium/Low

## Component
Which contract/file is affected

## Description
Detailed explanation of the bug

## Proof of Concept
Code/steps to reproduce

## Impact
What can an attacker do?

## Recommended Fix
Suggested solution

## Wallet Address
For bounty payment (optional)
```

### 2. Review Process

| Stage | Timeline | Action |
|-------|----------|--------|
| Acknowledgment | 24 hours | Confirm receipt |
| Triage | 3 days | Severity assessment |
| Validation | 7 days | Technical review |
| Resolution | 14 days | Fix development |
| Payment | 7 days after fix | Bounty payout |

### 3. Payment

- Paid in BLNK tokens
- USD value at time of fix
- Locked for 30 days (anti-dump)
- Linear vesting over 3 months

## Rules

### Responsible Disclosure
1. Do not exploit the bug
2. Do not publicly disclose before fix
3. Allow reasonable time for fix
4. Follow coordinated disclosure

### Eligibility
- Must be first reporter
- Must provide working PoC
- Must not be team member
- Must not violate laws

### Exclusions
- Social engineering
- Physical attacks
- Third-party services
- Already reported issues

## Past Reports

| Date | Reporter | Severity | Bounty | Status |
|------|----------|----------|--------|--------|
| | | | | |

## Contact

- **Email:** security@blnk.io
- **PGP Key:** [Download](https://blnk.io/pgp-key)
- **Discord:** #security channel (private)
- **Telegram:** @blnk_security

## References

- [Immunefi](https://immunefi.com)
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Ethereum Bug Bounty](https://ethereum.org/en/bug-bounty/)

---

**Program Start:** _______________  
**Last Updated:** 2026-02-24  
**Version:** 1.0
