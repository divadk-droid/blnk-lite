/**
 * Prometheus Metrics
 * Expose metrics for monitoring
 */

class PrometheusMetrics {
  constructor() {
    this.metrics = {
      httpRequestsTotal: 0,
      httpRequestDuration: [],
      gateDecisions: { PASS: 0, WARN: 0, BLOCK: 0 },
      cacheHits: 0,
      cacheMisses: 0,
      activeConnections: 0
    };
  }

  recordRequest(method, path, duration, status) {
    this.metrics.httpRequestsTotal++;
    this.metrics.httpRequestDuration.push(duration);
  }

  recordGateDecision(decision) {
    this.metrics.gateDecisions[decision]++;
  }

  recordCache(hit) {
    if (hit) this.metrics.cacheHits++;
    else this.metrics.cacheMisses++;
  }

  getMetrics() {
    const durations = this.metrics.httpRequestDuration;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    return `
# HELP blnk_http_requests_total Total HTTP requests
# TYPE blnk_http_requests_total counter
blnk_http_requests_total ${this.metrics.httpRequestsTotal}

# HELP blnk_gate_decisions_total Gate decisions by type
# TYPE blnk_gate_decisions_total counter
blnk_gate_decisions_total{decision="PASS"} ${this.metrics.gateDecisions.PASS}
blnk_gate_decisions_total{decision="WARN"} ${this.metrics.gateDecisions.WARN}
blnk_gate_decisions_total{decision="BLOCK"} ${this.metrics.gateDecisions.BLOCK}

# HELP blnk_cache_hit_ratio Cache hit ratio
# TYPE blnk_cache_hit_ratio gauge
blnk_cache_hit_ratio ${this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)}
`;
  }
}

module.exports = { PrometheusMetrics };
