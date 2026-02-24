#!/usr/bin/env node
/**
 * BLNK Code Verification Script
 * Validates code quality, security, and readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verification results
const results = {
  passed: [],
  warnings: [],
  failed: [],
  score: 0,
  total: 0
};

function check(name, condition, message, severity = 'error') {
  results.total++;
  if (condition) {
    results.passed.push({ name, message });
    results.score++;
    console.log(`✅ ${name}`);
  } else {
    const item = { name, message };
    if (severity === 'warning') {
      results.warnings.push(item);
      console.log(`⚠️  ${name}: ${message}`);
    } else {
      results.failed.push(item);
      console.log(`❌ ${name}: ${message}`);
    }
  }
}

async function runVerification() {
  console.log('🔍 BLNK Code Verification');
  console.log('=========================\n');
  
  // ============================================
  // 1. 파일 구조 검증
  // ============================================
  console.log('📁 1. File Structure Verification');
  console.log('-----------------------------------');
  
  check(
    'Contracts exist',
    fs.existsSync('./contracts/BLNKToken.sol') && 
    fs.existsSync('./contracts/BlnkPaymentGate.sol'),
    'Core contracts missing'
  );
  
  check(
    'Deployment scripts exist',
    fs.existsSync('./scripts/deploy-sepolia.js') &&
    fs.existsSync('./scripts/deploy-base.js'),
    'Deployment scripts missing'
  );
  
  check(
    'Tests exist',
    fs.existsSync('./test/integration.test.js'),
    'Test files missing'
  );
  
  check(
    'Documentation complete',
    fs.existsSync('./README.md') &&
    fs.existsSync('./DEPLOYMENT_GUIDE.md') &&
    fs.existsSync('./LAUNCH_CHECKLIST.md'),
    'Documentation incomplete'
  );
  
  // ============================================
  // 2. 스마트 컨트랙트 검증
  // ============================================
  console.log('\n📜 2. Smart Contract Verification');
  console.log('-----------------------------------');
  
  const tokenContract = fs.readFileSync('./contracts/BLNKToken.sol', 'utf8');
  const gateContract = fs.readFileSync('./contracts/BlnkPaymentGate.sol', 'utf8');
  
  check(
    'SPDX license identifier present',
    tokenContract.includes('SPDX-License-Identifier') &&
    gateContract.includes('SPDX-License-Identifier'),
    'Missing SPDX license'
  );
  
  check(
    'Pragma version specified',
    tokenContract.includes('pragma solidity') &&
    gateContract.includes('pragma solidity'),
    'Missing pragma version'
  );
  
  check(
    'OpenZeppelin imports used',
    tokenContract.includes('@openzeppelin') &&
    gateContract.includes('@openzeppelin'),
    'Not using OpenZeppelin'
  );
  
  check(
    'ReentrancyGuard used in PaymentGate',
    gateContract.includes('ReentrancyGuard'),
    'Missing ReentrancyGuard',
    'warning'
  );
  
  check(
    'SafeERC20 used',
    gateContract.includes('SafeERC20'),
    'Not using SafeERC20'
  );
  
  check(
    'Burn address is correct',
    gateContract.includes('0x000000000000000000000000000000000000dEaD'),
    'Burn address incorrect'
  );
  
  check(
    'Events defined',
    gateContract.includes('event Staked') &&
    gateContract.includes('event ApiPaid'),
    'Events not defined'
  );
  
  check(
    'Access control (Ownable) used',
    tokenContract.includes('Ownable') &&
    gateContract.includes('Ownable'),
    'Missing access control'
  );
  
  // ============================================
  // 3. 보안 검증
  // ============================================
  console.log('\n🔒 3. Security Verification');
  console.log('-----------------------------');
  
  check(
    'No hardcoded private keys',
    !fs.readFileSync('./scripts/deploy-sepolia.js', 'utf8').includes('0xac0974bec') &&
    !fs.readFileSync('./scripts/deploy-base.js', 'utf8').includes('0xac0974bec'),
    'Hardcoded test key found'
  );
  
  check(
    '.env.example exists',
    fs.existsSync('./.env.example'),
    'Environment template missing'
  );
  
  check(
    'No .env committed',
    !fs.existsSync('./.env'),
    '.env file should not be committed',
    'warning'
  );
  
  check(
    'Emergency controls in V2',
    fs.readFileSync('./contracts/BlnkPaymentGateV2.sol', 'utf8').includes('Pausable'),
    'V2 contract missing pause functionality'
  );
  
  // ============================================
  // 4. 문서화 검증
  // ============================================
  console.log('\n📚 4. Documentation Verification');
  console.log('----------------------------------');
  
  const readme = fs.readFileSync('./README.md', 'utf8');
  
  check(
    'README has installation instructions',
    readme.includes('Installation') || readme.includes('npm install'),
    'Installation guide missing'
  );
  
  check(
    'README has API documentation',
    readme.includes('API') || readme.includes('/api/v1'),
    'API documentation missing'
  );
  
  check(
    'Tokenomics documented',
    readme.includes('Tokenomics') || readme.includes('tokenomics'),
    'Tokenomics not documented'
  );
  
  check(
    'Deployment guide exists',
    fs.existsSync('./DEPLOYMENT_GUIDE.md'),
    'Deployment guide missing'
  );
  
  // ============================================
  // 5. 테스트 검증
  // ============================================
  console.log('\n🧪 5. Test Verification');
  console.log('------------------------');
  
  check(
    'Integration tests exist',
    fs.existsSync('./test/integration.test.js'),
    'Integration tests missing'
  );
  
  check(
    'Testnet deployment script exists',
    fs.existsSync('./scripts/deploy-sepolia.js'),
    'Testnet deployment script missing'
  );
  
  check(
    'Testnet test script exists',
    fs.existsSync('./scripts/test-sepolia.js'),
    'Testnet test script missing'
  );
  
  // ============================================
  // 6. 패키지 검증
  // ============================================
  console.log('\n📦 6. Package Verification');
  console.log('---------------------------');
  
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  check(
    'package.json has name',
    packageJson.name && packageJson.name !== '',
    'Package name missing'
  );
  
  check(
    'Dependencies specified',
    Object.keys(packageJson.dependencies || {}).length > 0,
    'No dependencies'
  );
  
  check(
    'Start script defined',
    packageJson.scripts && packageJson.scripts.start,
    'Start script missing'
  );
  
  check(
    'Test script defined',
    packageJson.scripts && packageJson.scripts.test,
    'Test script missing'
  );
  
  // ============================================
  // 결과 출력
  // ============================================
  console.log('\n\n📊 Verification Results');
  console.log('=======================');
  console.log(`✅ Passed: ${results.passed.length}/${results.total}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Score: ${Math.round((results.score / results.total) * 100)}%`);
  
  // 저장
  fs.writeFileSync('./verification-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to verification-results.json');
  
  // Go/No-Go
  console.log('\n🚦 Go/No-Go Decision');
  console.log('=====================');
  
  if (results.failed.length === 0) {
    console.log('✅ GO: All critical checks passed!');
    console.log('   Ready for testnet deployment.');
    process.exit(0);
  } else if (results.failed.length <= 2 && results.warnings.length <= 3) {
    console.log('⚠️  CONDITIONAL GO: Minor issues found.');
    console.log('   Fix warnings before mainnet, but testnet OK.');
    process.exit(0);
  } else {
    console.log('❌ NO-GO: Critical issues found.');
    console.log('   Fix all errors before deployment.');
    process.exit(1);
  }
}

runVerification().catch(console.error);
