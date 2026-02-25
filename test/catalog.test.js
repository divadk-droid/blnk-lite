const request = require('supertest');
const express = require('express');

describe('API Catalog', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/catalog', require('../../src/api/routes/catalog'));
  });
  
  describe('GET /api/v1/catalog', () => {
    it('should return full API catalog', async () => {
      const res = await request(app).get('/api/v1/catalog');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('categories');
      expect(res.body.categories).toBeInstanceOf(Array);
    });
  });
  
  describe('GET /api/v1/catalog/categories', () => {
    it('should return categories list', async () => {
      const res = await request(app).get('/api/v1/catalog/categories');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(res.body).toHaveProperty('totalCategories');
    });
  });
  
  describe('GET /api/v1/catalog/pricing', () => {
    it('should return pricing information', async () => {
      const res = await request(app).get('/api/v1/catalog/pricing');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currency');
      expect(res.body).toHaveProperty('perCall');
      expect(res.body).toHaveProperty('subscriptions');
    });
  });
  
  describe('GET /api/v1/catalog/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/catalog/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('healthy');
    });
  });
});