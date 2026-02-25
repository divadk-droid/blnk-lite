const request = require('supertest');
const express = require('express');

describe('Billing API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/billing', require('../../src/api/routes/billing').router);
  });
  
  describe('GET /api/v1/billing/plans', () => {
    it('should return all pricing plans', async () => {
      const res = await request(app).get('/api/v1/billing/plans');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('plans');
      expect(res.body.plans).toBeInstanceOf(Array);
      expect(res.body.plans.length).toBe(4); // free, starter, pro, enterprise
    });
    
    it('should include free plan', async () => {
      const res = await request(app).get('/api/v1/billing/plans');
      const freePlan = res.body.plans.find(p => p.id === 'free');
      
      expect(freePlan).toBeDefined();
      expect(freePlan.price).toBe(0);
      expect(freePlan.dailyLimit).toBe(100);
    });
  });
  
  describe('GET /api/v1/billing/usage', () => {
    it('should return usage for free tier', async () => {
      const res = await request(app)
        .get('/api/v1/billing/usage')
        .set('x-api-key', 'free');
      
      expect(res.status).toBe(200);
      expect(res.body.tier).toBe('free');
      expect(res.body.daily).toHaveProperty('limit');
      expect(res.body.daily).toHaveProperty('used');
      expect(res.body.daily).toHaveProperty('remaining');
    });
    
    it('should return usage for pro tier', async () => {
      const res = await request(app)
        .get('/api/v1/billing/usage')
        .set('x-api-key', 'pro_123');
      
      expect(res.status).toBe(200);
      expect(res.body.tier).toBe('pro');
    });
  });
  
  describe('POST /api/v1/billing/upgrade', () => {
    it('should initiate upgrade', async () => {
      const res = await request(app)
        .post('/api/v1/billing/upgrade')
        .send({ plan: 'starter' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('checkoutUrl');
      expect(res.body).toHaveProperty('apiKey');
    });
    
    it('should reject invalid plan', async () => {
      const res = await request(app)
        .post('/api/v1/billing/upgrade')
        .send({ plan: 'invalid' });
      
      expect(res.status).toBe(400);
    });
  });
});