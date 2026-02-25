const request = require('supertest');
const express = require('express');

describe('HFT Risk API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/hft', require('../../src/api/routes/hft'));
  });
  
  describe('POST /api/v1/hft/risk-assess', () => {
    it('should return 400 if contractAddress is missing', async () => {
      const res = await request(app)
        .post('/api/v1/hft/risk-assess')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('contractAddress');
    });
    
    it('should return risk assessment with latency', async () => {
      const res = await request(app)
        .post('/api/v1/hft/risk-assess')
        .send({
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 1
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('assessmentId');
      expect(res.body).toHaveProperty('riskScore');
      expect(res.body).toHaveProperty('latency');
      expect(res.body).toHaveProperty('mevRisk');
    });
    
    it('should respond within 100ms', async () => {
      const start = Date.now();
      await request(app)
        .post('/api/v1/hft/risk-assess')
        .send({
          contractAddress: '0x1234567890123456789012345678901234567890'
        });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });
  });
});