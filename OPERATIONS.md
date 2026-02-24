# BLNK Operations Monitoring Setup

## 1. Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/node

# Initialize in server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## 2. Performance Monitoring (Datadog)

```bash
# Install Datadog agent
docker run -d --name datadog-agent \
  -e DD_API_KEY=${DATADOG_API_KEY} \
  -e DD_SITE="datadoghq.com" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  datadog/agent:latest
```

## 3. Uptime Monitoring (UptimeRobot)

- URL: https://blnk-lite-production.up.railway.app/health
- Interval: 5 minutes
- Alert: Email + Telegram

## 4. Log Aggregation (Grafana Loki)

```yaml
# docker-compose.yml
version: '3'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
```

## 5. Alert Rules

### Critical (Immediate)
- API down > 2 minutes
- Contract balance abnormal
- Error rate > 5%

### Warning (30 min)
- Response time > 500ms
- Cache hit rate < 80%
- Memory usage > 80%

### Info (Daily)
- Daily transaction count
- New stakers
- Burn amount

## 6. Runbooks

### API Down
1. Check Railway status
2. Review error logs
3. Restart if needed
4. Notify on Discord

### Contract Issue
1. Pause contract
2. Analyze transaction
3. Contact security team
4. Prepare fix

### High Gas Prices
1. Enable batching
2. Adjust min payment
3. Notify users
