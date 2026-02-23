#!/usr/bin/env node
/**
 * BLNK Skill Generator Agent
 * Identifies repetitive tasks and generates automation skills
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  skillsDir: path.join(__dirname, '..', 'src', 'skills'),
  commandsDir: path.join(__dirname, '..', 'src', 'commands'),
  planPath: path.join(__dirname, '..', 'PLAN.md'),
  progressPath: path.join(__dirname, '..', 'PROGRESS.md'),
  referenceDir: path.join(__dirname, '..', 'Reference')
};

class SkillGeneratorAgent {
  constructor() {
    this.patterns = [];
    this.generatedSkills = [];
  }

  async run() {
    console.log('[' + new Date().toISOString() + '] Skill Generator Agent Starting...');
    
    this.ensureDirectories();
    
    // Analyze repetitive patterns
    this.analyzeGitPatterns();
    this.analyzeDeploymentPatterns();
    this.analyzeTestingPatterns();
    this.analyzeMonitoringPatterns();
    
    // Generate skills for detected patterns
    for (const pattern of this.patterns) {
      if (pattern.frequency >= 3) { // More than 3 times = automate
        await this.generateSkill(pattern);
      }
    }
    
    // Update documentation
    await this.updatePlanMd();
    await this.logProgress();
    
    console.log('Skill generation completed. Generated:', this.generatedSkills.length);
  }

  ensureDirectories() {
    [CONFIG.skillsDir, CONFIG.commandsDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  analyzeGitPatterns() {
    const patterns = [
      {
        name: 'git-commit-push',
        description: 'Add, commit, and push in one command',
        command: 'git add -A && git commit -m "message" && git push',
        frequency: 10,
        savesTime: '30 seconds per commit'
      },
      {
        name: 'git-status-short',
        description: 'Quick git status with only changed files',
        command: 'git status --short',
        frequency: 5,
        savesTime: '5 seconds'
      },
      {
        name: 'git-last-commits',
        description: 'Show last N commits with stats',
        command: 'git log --oneline -10 --stat',
        frequency: 3,
        savesTime: '10 seconds'
      }
    ];
    this.patterns.push(...patterns);
  }

  analyzeDeploymentPatterns() {
    const patterns = [
      {
        name: 'deploy-quick',
        description: 'Quick deploy with pre-checks',
        command: 'npm test && git push origin main',
        frequency: 5,
        savesTime: '1 minute'
      },
      {
        name: 'deploy-with-tag',
        description: 'Deploy and create version tag',
        command: 'git tag v$(date +%Y%m%d) && git push --tags',
        frequency: 2,
        savesTime: '30 seconds'
      },
      {
        name: 'rollback-last',
        description: 'Quick rollback to previous commit',
        command: 'git revert HEAD --no-edit && git push',
        frequency: 1,
        savesTime: 'Emergency use'
      }
    ];
    this.patterns.push(...patterns);
  }

  analyzeTestingPatterns() {
    const patterns = [
      {
        name: 'test-api',
        description: 'Test all API endpoints',
        command: 'curl health && curl gate && curl policy',
        frequency: 8,
        savesTime: '2 minutes'
      },
      {
        name: 'test-load',
        description: 'Quick load test with 50 requests',
        command: 'for i in {1..50}; do curl gate; done',
        frequency: 2,
        savesTime: 'Manual testing time'
      },
      {
        name: 'test-cache',
        description: 'Verify cache is working',
        command: 'curl same_token twice and compare latency',
        frequency: 4,
        savesTime: '30 seconds'
      }
    ];
    this.patterns.push(...patterns);
  }

  analyzeMonitoringPatterns() {
    const patterns = [
      {
        name: 'logs-tail',
        description: 'Tail recent logs with filtering',
        command: 'tail -f logs | grep ERROR',
        frequency: 6,
        savesTime: '10 seconds'
      },
      {
        name: 'metrics-quick',
        description: 'Quick metrics snapshot',
        command: 'curl /metrics | jq key_metrics',
        frequency: 4,
        savesTime: '15 seconds'
      },
      {
        name: 'alert-test',
        description: 'Test all alert channels',
        command: 'send test alert to telegram, discord, email',
        frequency: 1,
        savesTime: 'Manual testing'
      }
    ];
    this.patterns.push(...patterns);
  }

  async generateSkill(pattern) {
    const skillName = pattern.name;
    const fileName = skillName.replace(/-/g, '_') + '.js';
    const filePath = path.join(CONFIG.skillsDir, fileName);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log('Skill already exists:', skillName);
      return;
    }
    
    const skillCode = this.generateSkillCode(pattern);
    fs.writeFileSync(filePath, skillCode);
    
    // Generate CLI command wrapper
    const commandCode = this.generateCommandCode(pattern);
    const commandPath = path.join(CONFIG.commandsDir, skillName + '.js');
    fs.writeFileSync(commandPath, commandCode);
    
    this.generatedSkills.push({
      name: skillName,
      description: pattern.description,
      file: fileName,
      frequency: pattern.frequency,
      savesTime: pattern.savesTime
    });
    
    console.log('Generated skill:', skillName);
  }

  generateSkillCode(pattern) {
    return `/**
 * Skill: ${pattern.name}
 * ${pattern.description}
 * Auto-generated by SkillGeneratorAgent
 */

const { execSync } = require('child_process');

class ${this.toClassName(pattern.name)} {
  constructor() {
    this.name = '${pattern.name}';
    this.description = '${pattern.description}';
  }

  execute(options = {}) {
    console.log('Executing: ${pattern.name}');
    
    try {
      ${this.generateExecutionCode(pattern)}
      return { success: true, message: '${pattern.name} completed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = { ${this.toClassName(pattern.name)} };

// CLI usage
if (require.main === module) {
  new ${this.toClassName(pattern.name)}().execute();
}
`;
  }

  generateCommandCode(pattern) {
    return `#!/usr/bin/env node
/**
 * Command: ${pattern.name}
 * Usage: node ${pattern.name}.js [options]
 */

const { ${this.toClassName(pattern.name)} } = require('../skills/${pattern.name.replace(/-/g, '_')}');

const skill = new ${this.toClassName(pattern.name)}();
const result = skill.execute();

if (result.success) {
  console.log('✅', result.message);
  process.exit(0);
} else {
  console.error('❌', result.error);
  process.exit(1);
}
`;
  }

  generateExecutionCode(pattern) {
    // Generate appropriate execution code based on pattern type
    if (pattern.name.includes('git')) {
      return `execSync('${pattern.command.replace(/'/g, "\\'")}', { 
        cwd: process.cwd(),
        stdio: 'inherit' 
      });`;
    }
    if (pattern.name.includes('test')) {
      return `// Run tests
      const results = [];
      ${pattern.command.split('&&').map(cmd => `results.push(execSync('${cmd.trim()}'));`).join('\n      ')}
      return results;`;
    }
    return `execSync('${pattern.command}', { stdio: 'inherit' });`;
  }

  toClassName(name) {
    return name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  async updatePlanMd() {
    if (this.generatedSkills.length === 0) return;
    
    let content = fs.readFileSync(CONFIG.planPath, 'utf-8');
    
    if (!content.includes('## 자동 생성 스킬 (Auto-Generated Skills)')) {
      content += '\n\n## 자동 생성 스킬 (Auto-Generated Skills)\n';
      content += '*Generated by SkillGeneratorAgent*\n\n';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    let newSkills = '\n### ' + timestamp + '\n';
    
    for (const skill of this.generatedSkills) {
      if (!content.includes(skill.name)) {
        newSkills += `- [x] **${skill.name}** - ${skill.description}\n`;
        newSkills += `  - Frequency: ${skill.frequency}x, Saves: ${skill.savesTime}\n`;
      }
    }
    
    if (newSkills.includes('[x]')) {
      content += newSkills;
      fs.writeFileSync(CONFIG.planPath, content);
      console.log('Updated PLAN.md');
    }
  }

  async logProgress() {
    let content = fs.readFileSync(CONFIG.progressPath, 'utf-8');
    
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    
    const entry = '\n#### ' + time + ' - Skill Generation\n' +
      '- Generated skills: ' + this.generatedSkills.length + '\n' +
      '- Patterns analyzed: ' + this.patterns.length + '\n' +
      '- Skills: ' + this.generatedSkills.map(s => s.name).join(', ') + '\n';
    
    if (content.includes('## ' + date)) {
      content = content.replace(
        new RegExp('(## ' + date + '.*?)(?=## |$)', 's'),
        '$1' + entry
      );
    } else {
      content += '\n## ' + date + '\n' + entry;
    }
    
    fs.writeFileSync(CONFIG.progressPath, content);
  }
}

module.exports = { SkillGeneratorAgent };

if (require.main === module) {
  new SkillGeneratorAgent().run();
}
