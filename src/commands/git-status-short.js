#!/usr/bin/env node
/**
 * Command: git-status-short
 * Usage: node git-status-short.js [options]
 */

const { GitStatusShort } = require('../skills/git_status_short');

const skill = new GitStatusShort();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
