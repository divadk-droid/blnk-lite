const request = require('supertest');
const express = require('express');

// Mock the modules
jest.mock('../../modules/ai-content-scanner/AIContentScanner', () => {
  return jest.fn().mockImplementation(() => ({
    scan: jest.fn().mockResolvedValue({
      scanId: 'scan_123',
      riskScore: 25,
      riskLevel: 'LOW',
      aiGenerated: false,
      deepfakeProbability: 0.05,
      copyrightRisk: 'LOW',
      c2paVerified: true,
      processingTime: '100ms'
    })
  }));
});

describe('AI Content API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/ai-content', require('../../src/api/routes/ai-content'));
  });
  
  describe('POST /api/v1/ai-content/scan', () => {
    it('should return 400 if contentUrl is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ai-content/scan')
        .send({ contentType: 'image' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('contentUrl');
    });
    
    it('should return 400 if contentType is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ai-content/scan')
        .send({ contentUrl: 'https://example.com/image.jpg' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('contentType');
    });
    
    it('should return scan result for valid request', async () => {
      const res = await request(app)
        .post('/api/v1/ai-content/scan')
        .send({
          contentUrl: 'https://example.com/image.jpg',
          contentType: 'image'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('scanId');
      expect(res.body).toHaveProperty('riskScore');
      expect(res.body).toHaveProperty('riskLevel');
    });
  });
  
  describe('POST /api/v1/ai-content/verify', () => {
    it('should return 400 if contentUrl is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ai-content/verify')
        .send({});
      
      expect(res.status).toBe(400);
    });
    
    it('should return verification result', async () => {
      const res = await request(app)
        .post('/api/v1/ai-content/verify')
        .send({ contentUrl: 'https://example.com/image.jpg' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('verificationId');
      expect(res.body).toHaveProperty('c2paValid');
    });
  });
});