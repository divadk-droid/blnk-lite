const redis = require('redis');

class CacheLayer {
  constructor(redisUrl = 'redis://localhost:6379') {
    this.client = redis.createClient({ url: redisUrl });
    this.client.on('error', (err) => console.error('Redis error:', err));
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async getGateResult(contractAddress, chain = 'ethereum') {
    await this.connect();
    const key = `gate:${chain}:${contractAddress.toLowerCase()}`;
    const cached = await this.client.get(key);
    
    if (cached) {
      const result = JSON.parse(cached);
      // Check if still valid
      const age = Date.now() - new Date(result.timestamp).getTime();
      const ttl = result.cache?.ttl_seconds || 300;
      
      if (age < ttl * 1000) {
        result.cache.hit = true;
        result.cache.age_seconds = Math.floor(age / 1000);
        return result;
      }
    }
    
    return null;
  }

  async setGateResult(contractAddress, result, chain = 'ethereum', ttl = 300) {
    await this.connect();
    const key = `gate:${chain}:${contractAddress.toLowerCase()}`;
    
    result.cache = {
      ttl_seconds: ttl,
      timestamp: new Date().toISOString(),
      hit: false
    };
    
    await this.client.setEx(key, ttl, JSON.stringify(result));
    return result;
  }

  async getScanResult(contractAddress, chain = 'ethereum') {
    await this.connect();
    const key = `scan:${chain}:${contractAddress.toLowerCase()}`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setScanResult(contractAddress, result, chain = 'ethereum', ttl = 3600) {
    await this.connect();
    const key = `scan:${chain}:${contractAddress.toLowerCase()}`;
    await this.client.setEx(key, ttl, JSON.stringify(result));
    return result;
  }

  // Stats
  async getStats() {
    await this.connect();
    const keys = await this.client.keys('*');
    const gateKeys = keys.filter(k => k.startsWith('gate:'));
    const scanKeys = keys.filter(k => k.startsWith('scan:'));
    
    return {
      totalKeys: keys.length,
      gateCacheSize: gateKeys.length,
      scanCacheSize: scanKeys.length
    };
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

// In-memory fallback for development
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async getGateResult(contractAddress, chain = 'ethereum') {
    const key = `gate:${chain}:${contractAddress.toLowerCase()}`;
    const item = this.store.get(key);
    
    if (item) {
      const age = Date.now() - item.timestamp;
      if (age < item.ttl * 1000) {
        item.data.cache = { hit: true, age_seconds: Math.floor(age / 1000) };
        return item.data;
      }
      this.store.delete(key);
    }
    return null;
  }

  async setGateResult(contractAddress, result, chain = 'ethereum', ttl = 300) {
    const key = `gate:${chain}:${contractAddress.toLowerCase()}`;
    result.cache = { ttl_seconds: ttl, timestamp: new Date().toISOString(), hit: false };
    this.store.set(key, { data: result, timestamp: Date.now(), ttl: ttl * 1000 });
    return result;
  }

  async getScanResult(contractAddress, chain = 'ethereum') {
    const key = `scan:${chain}:${contractAddress.toLowerCase()}`;
    const item = this.store.get(key);
    return item?.data || null;
  }

  async setScanResult(contractAddress, result, chain = 'ethereum', ttl = 3600) {
    const key = `scan:${chain}:${contractAddress.toLowerCase()}`;
    this.store.set(key, { data: result, timestamp: Date.now(), ttl: ttl * 1000 });
    return result;
  }

  async getStats() {
    return {
      totalKeys: this.store.size,
      gateCacheSize: Array.from(this.store.keys()).filter(k => k.startsWith('gate:')).length,
      scanCacheSize: Array.from(this.store.keys()).filter(k => k.startsWith('scan:')).length
    };
  }
}

module.exports = { CacheLayer, MemoryCache };
