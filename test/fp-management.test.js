const request = require('supertest');
const express = require('express');

describe('FP Management API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/fp', require('../../src/api/routes/fp-management'));
  });
  
  describe('GET /api/v1/fp/stats', () => {
    it('should return FP statistics', async () => {
      const res = await request(app).get('/api/v1/fp/stats');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalReports');
      expect(res.body).toHaveProperty('fpRate');
      expect(res.body).toHaveProperty('targetFpRate');
    });
  });
  
  describe('POST /api/v1/fp/report', () => {
    it('should create FP report', async () => {
      const res = await request(app)
        .post('/api/v1/fp/report')
        .send({
          scanId: 'scan_123',
          reason: 'Incorrect risk assessment',
          expectedDecision: 'PASS',
          actualDecision: 'BLOCK',
          userAddress: '0x1234...'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reportId');
      expect(res.body.status).toBe('pending_review');
    });
    
    it('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/v1/fp/report')
        .send({});
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('POST /api/v1/fp/override', () => {
    it('should require admin key', async () => {
      const res = await request(app)
        .post('/api/v1/fp/override')
        .send({
          scanId: 'scan_123',
          reason: 'Admin approved'
        });
      
      expect(res.status).toBe(403);
    });
  });
  
  describe('GET /api/v1/fp/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/fp/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });
});