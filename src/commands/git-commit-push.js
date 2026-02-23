#!/usr/bin/env node
/**
 * Command: git-commit-push
 * Usage: node git-commit-push.js [options]
 */

const { GitCommitPush } = require('../skills/git_commit_push');

const skill = new GitCommitPush();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
