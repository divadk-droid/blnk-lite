const { ContractAnalyzer } = require('./src/analyzer');

async function testAnalyzer() {
  console.log('🧪 Testing BLNK Contract Analyzer\n');
  
  // Use public RPC for testing
  const analyzer = new ContractAnalyzer('https://eth.llamarpc.com');
  
  // Test cases
  const testCases = [
    // Safe tokens
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'WETH' },
    { address: '0xA0b86a33E6441E6C7D3D4B4f5C6D7E8F9A0B1C2D', name: 'Unknown (random)' },
    { address: '0x1234567890123456789012345678901234567890', name: 'Empty (should fail)' }
  ];
  
  for (const test of testCases) {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log(`   Address: ${test.address}`);
    
    try {
      const result = await analyzer.quickCheck(test.address);
      console.log(`   Decision: ${result.decision}`);
      console.log(`   Risk Score: ${result.riskScore}`);
      console.log(`   Risk Level: ${result.riskLevel}`);
      console.log(`   Confidence: ${result.confidence}`);
      
      if (result.flags) {
        const detected = Object.entries(result.flags)
          .filter(([_, v]) => v.detected)
          .map(([k, _]) => k);
        if (detected.length > 0) {
          console.log(`   Detected: ${detected.join(', ')}`);
        }
      }
      
      if (result.reason) {
        console.log(`   Reason: ${result.reason}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Test complete');
}

testAnalyzer().catch(console.error);
