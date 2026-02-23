#!/usr/bin/env node
/**
 * Command: logs-tail
 * Usage: node logs-tail.js [options]
 */

const { LogsTail } = require('../skills/logs_tail');

const skill = new LogsTail();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
