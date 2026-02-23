#!/usr/bin/env node
/**
 * Command: test-cache
 * Usage: node test-cache.js [options]
 */

const { TestCache } = require('../skills/test_cache');

const skill = new TestCache();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
