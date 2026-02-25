const request = require('supertest');
const express = require('express');

describe('Validation API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/validation', require('../../src/api/routes/validation'));
  });
  
  describe('POST /api/v1/validation/token-safety', () => {
    it('should return 400 if contractAddress is missing', async () => {
      const res = await request(app)
        .post('/api/v1/validation/token-safety')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('contractAddress');
    });
    
    it('should return token safety check result', async () => {
      const res = await request(app)
        .post('/api/v1/validation/token-safety')
        .send({
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 1
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('scanId');
      expect(res.body).toHaveProperty('riskLevel');
      expect(res.body).toHaveProperty('riskScore');
      expect(res.body).toHaveProperty('checks');
      expect(res.body.checks).toHaveProperty('minting');
    });
  });
});