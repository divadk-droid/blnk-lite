/**
 * API Endpoint Tests for 6 New Routes
 * Run with: node test/api-endpoints.test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// Test helper function
async function testEndpoint(method, path, body = null, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const result = {
          description,
          method,
          path,
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          response: data
        };
        TEST_RESULTS.push(result);
        console.log(`✓ ${description}: ${res.statusCode}`);
        resolve(result);
      });
    });

    req.on('error', (error) => {
      const result = {
        description,
        method,
        path,
        statusCode: 0,
        success: false,
        error: error.message
      };
      TEST_RESULTS.push(result);
      console.log(`✗ ${description}: ${error.message}`);
      resolve(result);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test all endpoints
async function runTests() {
  console.log('\n🧪 Testing BLNK API Endpoints\n');
  console.log('=' .repeat(50));

  // Test 1: AI Content Scanner
  await testEndpoint('POST', '/api/v1/ai-content/scan', {
    contentUrl: 'https://example.com/image.jpg',
    contentType: 'image',
    checks: ['ai_detection', 'copyright', 'c2pa']
  }, 'AI Content Scanner - Valid Request');

  // Test 2: AI Content Scanner - Invalid
  await testEndpoint('POST', '/api/v1/ai-content/scan', {
    contentUrl: 'https://example.com/image.jpg',
    contentType: 'invalid_type'
  }, 'AI Content Scanner - Invalid Type');

  // Test 3: HFT Risk API
  await testEndpoint('POST', '/api/v1/hft/risk-assess', {
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chainId: '1',
    transactionData: { value: '1000000000000000000' }
  }, 'HFT Risk API - Valid Request');

  // Test 4: HFT Risk API - Invalid address
  await testEndpoint('POST', '/api/v1/hft/risk-assess', {
    contractAddress: 'invalid_address',
    chainId: '1'
  }, 'HFT Risk API - Invalid Address');

  // Test 5: Alpha Feed API
  await testEndpoint('POST', '/api/v1/alpha/feed', {
    target: 'ETH',
    analysisType: 'comprehensive',
    timeframe: '24h'
  }, 'Alpha Feed API - Valid Request');

  // Test 6: Alpha Feed API - Invalid type
  await testEndpoint('POST', '/api/v1/alpha/feed', {
    target: 'ETH',
    analysisType: 'invalid_type',
    timeframe: '24h'
  }, 'Alpha Feed API - Invalid Type');

  // Test 7: Report Generator
  await testEndpoint('POST', '/api/v1/reports/generate', {
    targetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    reportFormat: 'json',
    dateRange: {
      start: '2024-01-01',
      end: '2024-12-31'
    }
  }, 'Report Generator - JSON Format');

  // Test 8: Report Generator - Invalid format
  await testEndpoint('POST', '/api/v1/reports/generate', {
    targetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    reportFormat: 'invalid_format',
    dateRange: { start: '2024-01-01', end: '2024-12-31' }
  }, 'Report Generator - Invalid Format');

  // Test 9: Creator Credit Score
  await testEndpoint('POST', '/api/v1/creator/credit-score', {
    creatorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    sbtTokenId: 12345
  }, 'Creator Credit Score - With SBT');

  // Test 10: Creator Credit Score - No SBT
  await testEndpoint('POST', '/api/v1/creator/credit-score', {
    creatorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  }, 'Creator Credit Score - Without SBT');

  // Test 11: Token Safety Scan
  await testEndpoint('POST', '/api/v1/validation/token-safety', {
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chainId: '1'
  }, 'Token Safety Scan - Valid');

  // Test 12: Token Safety Scan - Invalid chain
  await testEndpoint('POST', '/api/v1/validation/token-safety', {
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chainId: 'invalid_chain'
  }, 'Token Safety Scan - Invalid Chain');

  // Test 13: HFT Health Check
  await testEndpoint('GET', '/api/v1/hft/health', null, 'HFT Health Check');

  // Test 14: Legacy Gate endpoint
  await testEndpoint('POST', '/api/v1/gate', {
    token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    actionType: 'swap',
    amount: '1.0',
    chain: 'ethereum'
  }, 'Legacy Gate Endpoint');

  // Test 15: Legacy Scan endpoint
  await testEndpoint('POST', '/api/v1/scan', {
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chain: 'ethereum'
  }, 'Legacy Scan Endpoint');

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Summary\n');
  
  const passed = TEST_RESULTS.filter(r => r.success).length;
  const failed = TEST_RESULTS.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${TEST_RESULTS.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / TEST_RESULTS.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    TEST_RESULTS.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.description}: ${r.error || `HTTP ${r.statusCode}`}`);
    });
  }

  console.log('\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running before tests
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running\n');
        resolve(true);
      } else {
        console.log('❌ Server returned non-200 status\n');
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log('❌ Server is not running. Please start with: npm start\n');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('❌ Server connection timeout\n');
      resolve(false);
    });
  });
}

// Main
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
}

main();
