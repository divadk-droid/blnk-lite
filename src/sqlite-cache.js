const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * SQLite-based TTL Cache for Lite Mode
 * No Redis required, file-based, survives restarts
 */

class SQLiteCache {
  constructor(dbPath = './cache.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.hits = 0;
    this.misses = 0;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Create cache table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      const now = Math.floor(Date.now() / 1000);
      
      this.db.get(
        'SELECT value, expires_at FROM cache WHERE key = ? AND expires_at > ?',
        [key, now],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row) {
            this.hits++;
            try {
              const value = JSON.parse(row.value);
              value._cache = { hit: true, expires_in: row.expires_at - now };
              resolve(value);
            } catch (e) {
              resolve(null);
            }
          } else {
            this.misses++;
            resolve(null);
          }
        }
      );
    });
  }

  async set(key, value, ttlSeconds = 300) {
    return new Promise((resolve, reject) => {
      const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
      const jsonValue = JSON.stringify(value);
      
      this.db.run(
        `INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)`,
        [key, jsonValue, expiresAt],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async delete(key) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cache WHERE key = ?', [key], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async cleanup() {
    // Remove expired entries
    return new Promise((resolve, reject) => {
      const now = Math.floor(Date.now() / 1000);
      this.db.run('DELETE FROM cache WHERE expires_at <= ?', [now], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM cache', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          totalEntries: row.count,
          hits: this.hits,
          misses: this.misses,
          hitRate: this.hits + this.misses > 0 
            ? (this.hits / (this.hits + this.misses)).toFixed(2)
            : 0
        });
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = { SQLiteCache };
