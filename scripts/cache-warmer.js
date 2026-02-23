/**
 * BLNK Cache Warmer
 * Pre-populates cache with popular tokens
 */

const https = require('https');

const POPULAR_TOKENS = [
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH' },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC' },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC' },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI' },
  { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', symbol: 'MATIC' },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK' },
  { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB' },
  { address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53', symbol: 'BUSD' }
];

const API_URL = process.env.BLNK_API_URL || 'https://blnk-lite-production.up.railway.app';

async function warmCache() {
  console.log('🔥 Starting cache warm-up...\n');
  
  for (const token of POPULAR_TOKENS) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}/api/v1/gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.address,
          actionType: 'swap'
        })
      });
      
      const result = await response.json();
      const latency = Date.now() - startTime;
      
      console.log(`✅ ${token.symbol}: ${result.decision} (${latency}ms)`);
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
      
    } catch (error) {
      console.error(`❌ ${token.symbol}: ${error.message}`);
    }
  }
  
  console.log('\n🔥 Cache warm-up complete!');
}

// Run if called directly
if (require.main === module) {
  warmCache();
}

module.exports = { warmCache, POPULAR_TOKENS };
