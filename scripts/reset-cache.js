#!/usr/bin/env node
/**
 * BLNK Cache Reset Script
 * Fixes WETH/USDC gate mismatch by clearing stale cache entries
 */

const fs = require('fs');
const path = require('path');

const CACHE_DB_PATH = path.join(__dirname, '..', 'cache.db');

async function resetCache() {
  console.log('🔄 BLNK Cache Reset Tool');
  console.log('========================\n');

  try {
    // Check if cache file exists
    if (fs.existsSync(CACHE_DB_PATH)) {
      const stats = fs.statSync(CACHE_DB_PATH);
      console.log(`📁 Found cache file: ${CACHE_DB_PATH}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Modified: ${stats.mtime.toISOString()}\n`);

      // Backup existing cache
      const backupPath = `${CACHE_DB_PATH}.backup.${Date.now()}`;
      fs.copyFileSync(CACHE_DB_PATH, backupPath);
      console.log(`💾 Backup created: ${backupPath}\n`);

      // Delete cache file
      fs.unlinkSync(CACHE_DB_PATH);
      console.log('🗑️  Cache file deleted\n');
    } else {
      console.log('ℹ️  No cache file found (already clean)\n');
    }

    // Reinitialize cache
    console.log('🔄 Reinitializing cache...');
    
    // Simple cache init - just create empty DB
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(CACHE_DB_PATH);
    
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )`);
      
      db.run(`CREATE INDEX IF NOT EXISTS idx_expires ON cache(expires_at)`);
    });
    
    db.close();
    
    // Safe contracts list
    const safeContracts = [
      { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'WETH', chain: 'ethereum' },
      { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USDC', chain: 'ethereum' },
      { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'USDT', chain: 'ethereum' },
      { address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'DAI', chain: 'ethereum' },
    ];

    console.log('✅ Cache reinitialized\n');
    
    console.log('📊 Safe contracts will be cached on first request:');
    for (const contract of safeContracts) {
      console.log(`   • ${contract.name}: ${contract.address}`);
    }

    console.log('\n🎉 Cache reset complete!');
    console.log('📝 Next steps:');
    console.log('   1. Restart the server: npm start');
    console.log('   2. Test WETH/USDC gate calls');
    console.log('   3. Monitor for mismatch issues\n');

  } catch (error) {
    console.error('❌ Cache reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetCache();
