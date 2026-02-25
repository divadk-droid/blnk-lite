const request = require('supertest');
const express = require('express');

describe('Alpha Feed API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/alpha', require('../../src/api/routes/alpha'));
  });
  
  describe('POST /api/v1/alpha/feed', () => {
    it('should return 400 if target is missing', async () => {
      const res = await request(app)
        .post('/api/v1/alpha/feed')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('target');
    });
    
    it('should return alpha signals for wallet', async () => {
      const res = await request(app)
        .post('/api/v1/alpha/feed')
        .send({
          target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          analysisType: 'wallet',
          timeframe: '24h'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('feedId');
      expect(res.body).toHaveProperty('whaleMovements');
      expect(res.body).toHaveProperty('smartMoneyFlows');
      expect(res.body).toHaveProperty('earlyTrends');
    });
    
    it('should return alpha signals for token', async () => {
      const res = await request(app)
        .post('/api/v1/alpha/feed')
        .send({
          target: '0x1234...',
          analysisType: 'token'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.analysisType).toBe('token');
    });
  });
});