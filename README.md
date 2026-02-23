# BLNK Lite

Pre-trade risk infrastructure - Free tier MVP.

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/BLNK)

Or manually:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `RPC_URL` | No | https://eth.llamarpc.com | Ethereum RPC endpoint |
| `CACHE_TTL` | No | 300 | Cache TTL in seconds |

## API Endpoints

### POST /api/v1/gate
Pre-trade risk gate (1 RPC call)

```bash
curl -X POST https://your-app.railway.app/api/v1/gate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "actionType": "swap",
    "amount": "1.0"
  }'
```

Response:
```json
{
  "decision": "PASS",
  "risk_score": 10,
  "risk_level": "LOW",
  "confidence": 0.95,
  "gate_id": "gate_...",
  "latency_ms": 150,
  "mode": "LITE"
}
```

### GET /health
Health check

### GET /stats
Statistics

## Lite vs Pro

| Feature | Lite (Free) | Pro (Paid) |
|---------|-------------|------------|
| RPC Calls | 1 per check | Multiple |
| Cache | SQLite | Redis |
| Monitoring | Daily | Real-time |
| Chains | Ethereum | Multi-chain |
| Support | Community | Priority |

## License

MIT
