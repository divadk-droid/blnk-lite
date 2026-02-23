# BLNK Risk Gate - ACP Market Optimization

## 1. Invocation-Centered Description

### Short (50 chars)
```
Pre-trade risk gate: PASS/WARN/BLOCK in 2ms
```

### Medium (150 chars)
```
On-chain risk engine for AI agents. One API call returns PASS/WARN/BLOCK with evidence. 100 free calls/day. No signup required.
```

### Full
```
BLNK Risk Gate is pre-execution risk infrastructure for AI agents.

Before you swap, stake, or yield farm:
→ Call /api/v1/gate
→ Get verdict + evidence
→ Execute or abort

Designed for autonomous agents that need risk decisions without human review.

Key features:
• 1 RPC call = 2ms response
• Structured PASS/WARN/BLOCK
• Policy-based compliance (conservative/moderate/aggressive)
• Automatic upsell recommendations
• 100 free calls/day, no signup

Not investment advice. Technical risk assessment only.
```

## 2. Agent-Friendly Tool Metadata

```json
{
  "tool": {
    "name": "blnk_risk_gate",
    "description": "Evaluate token risk before trade execution. Returns PASS/WARN/BLOCK with confidence score and evidence.",
    "parameters": {
      "token": {
        "type": "string",
        "description": "ERC20 token contract address (0x...)",
        "required": true
      },
      "actionType": {
        "type": "string",
        "enum": ["swap", "dca", "yield", "bridge"],
        "description": "Type of action being evaluated",
        "required": true
      },
      "amount": {
        "type": "string",
        "description": "Optional: amount being traded",
        "required": false
      }
    },
    "returns": {
      "verdict": "PASS | WARN | BLOCK",
      "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
      "confidence": "0.0-1.0",
      "evidence": "Array of risk signals",
      "recommended_next_call": "Suggested follow-up action"
    }
  }
}
```

## 3. "Use this when..." Optimization

### Primary Triggers
```
Use BLNK Risk Gate when:

✓ Your agent is about to execute a swap
✓ You need pre-flight risk check without human review
✓ You want structured PASS/WARN/BLOCK decisions
✓ You need policy compliance (conservative/moderate/aggressive)
✓ You want automatic next-step recommendations
```

### Secondary Triggers
```
Also useful for:

→ DCA bots checking each purchase
→ Yield optimizers evaluating new pools
→ Portfolio rebalancing with risk constraints
→ DAO execution agents with compliance requirements
→ Multi-step workflows needing go/no-go decisions
```

### Anti-Triggers (What NOT to use for)
```
Do NOT use BLNK Risk Gate for:

✗ Investment advice (it's technical risk only)
✗ Guaranteed scam detection (false positives possible)
✗ Price prediction
✗ Portfolio allocation decisions
```

## 4. ACP Offering Card

```yaml
offering:
  id: blnk-risk-gate
  name: BLNK Risk Gate
  icon: 🛡️
  
  short_description: "Pre-trade risk gate: PASS/WARN/BLOCK in 2ms"
  
  full_description: |
    On-chain risk engine for AI agents.
    
    Before you swap, stake, or yield farm:
    → Call /api/v1/gate
    → Get verdict + evidence  
    → Execute or abort
    
    100 free calls/day. No signup.
  
  use_when:
    - "Agent is about to execute a swap"
    - "Need pre-flight risk check without human review"
    - "Want structured PASS/WARN/BLOCK decisions"
    - "Need policy compliance validation"
  
  dont_use_when:
    - "Need investment advice"
    - "Want guaranteed scam detection"
    - "Need price prediction"
  
  invocation_example: |
    POST /api/v1/gate
    {
      "token": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "actionType": "swap"
    }
    
    → Returns: { "verdict": "PASS", "risk_level": "LOW" }
  
  pricing:
    free: 100 calls/day
    basic: $19/mo (500/day)
    pro: $99/mo (2,000/day)
  
  tags:
    - risk
    - security
    - pre-trade
    - compliance
    - gate
    - agent-infrastructure
```

## 5. Agent System Prompt Integration

```
You have access to BLNK Risk Gate for pre-trade risk evaluation.

When to use:
- Before executing any swap, stake, or yield operation
- When evaluating new tokens for the first time
- When compliance policy requires risk check

How to use:
1. Call blnk_risk_gate with token address and action type
2. Check the verdict field
3. If PASS: proceed with execution
4. If WARN: review evidence, consider recommended_next_call
5. If BLOCK: abort and log reason

Always include risk_gate_verdict in your execution logs.
```

## 6. Comparison Table (Why BLNK vs Others)

| Feature | BLNK | Generic RPC | Manual Review |
|---------|------|-------------|---------------|
| Speed | 2ms | 200ms+ | Hours |
| Cost | $0-99/mo | Variable | $$$ |
| Automation | ✅ Full | ❌ Partial | ❌ None |
| Structured Output | ✅ PASS/WARN/BLOCK | ❌ Raw data | ❌ Subjective |
| Policy Compliance | ✅ Built-in | ❌ No | ❌ Manual |
| Agent-Native | ✅ Yes | ❌ No | ❌ No |

## 7. Testimonials (Template)

```
"We integrated BLNK Gate into our DCA bot. Now every purchase gets risk-checked automatically."
— [Agent Builder], [Project]

"The policy pack saved us from a compromised contract. BLOCKed before any funds moved."
— [DAO Operator], [Organization]

"2ms response time means our arbitrage bot doesn't lose edge."
— [Trading Agent Dev], [Strategy]
```

## 8. FAQ for ACP Listing

**Q: Is this a scam detector?**  
A: No. It's technical risk assessment. Some risky tokens may pass, some safe tokens may warn. Use as one input among many.

**Q: How fast is it really?**  
A: 2ms for cached results, 50-150ms for fresh lookups. One RPC call.

**Q: What chains?**  
A: Currently Ethereum mainnet. Multi-chain coming to PRO tier.

**Q: Do I need to hold $BLNK?**  
A: Not for FREE tier. Hold $BLNK to unlock higher rate limits on paid tiers.

**Q: Can I self-host?**  
A: Yes. Open source at github.com/divadk-droid/blnk-lite

---

**Ready for ACP market optimization.**
