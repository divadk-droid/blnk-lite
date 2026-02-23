#!/usr/bin/env node
/**
 * Command: test-api
 * Usage: node test-api.js [options]
 */

const { TestApi } = require('../skills/test_api');

const skill = new TestApi();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
