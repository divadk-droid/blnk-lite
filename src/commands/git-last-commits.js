#!/usr/bin/env node
/**
 * Command: git-last-commits
 * Usage: node git-last-commits.js [options]
 */

const { GitLastCommits } = require('../skills/git_last_commits');

const skill = new GitLastCommits();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
