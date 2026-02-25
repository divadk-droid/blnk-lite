const request = require('supertest');
const express = require('express');

describe('Creator API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/creator', require('../../src/api/routes/creator'));
  });
  
  describe('POST /api/v1/creator/credit-score', () => {
    it('should return 400 if neither creatorAddress nor sbtTokenId provided', async () => {
      const res = await request(app)
        .post('/api/v1/creator/credit-score')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('creatorAddress or sbtTokenId');
    });
    
    it('should return credit score by creatorAddress', async () => {
      const res = await request(app)
        .post('/api/v1/creator/credit-score')
        .send({
          creatorAddress: '0x1234567890123456789012345678901234567890'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('scoreId');
      expect(res.body).toHaveProperty('creditScore');
      expect(res.body).toHaveProperty('creditLevel');
      expect(res.body).toHaveProperty('verificationStatus');
    });
    
    it('should return credit score by sbtTokenId', async () => {
      const res = await request(app)
        .post('/api/v1/creator/credit-score')
        .send({
          sbtTokenId: 'sbt_12345'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('scoreId');
      expect(res.body).toHaveProperty('creditScore');
    });
    
    it('should include history when requested', async () => {
      const res = await request(app)
        .post('/api/v1/creator/credit-score')
        .send({
          creatorAddress: '0x1234567890123456789012345678901234567890',
          includeHistory: true
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('history');
    });
  });
});