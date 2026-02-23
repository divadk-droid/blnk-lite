#!/usr/bin/env node
/**
 * Command: deploy-quick
 * Usage: node deploy-quick.js [options]
 */

const { DeployQuick } = require('../skills/deploy_quick');

const skill = new DeployQuick();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
