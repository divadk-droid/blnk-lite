#!/usr/bin/env node
/**
 * Command: metrics-quick
 * Usage: node metrics-quick.js [options]
 */

const { MetricsQuick } = require('../skills/metrics_quick');

const skill = new MetricsQuick();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
