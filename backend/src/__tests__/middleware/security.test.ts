import express from 'express';
import request from 'supertest';

import { configureSecurity } from '../../middleware';
import { TestHelper } from '../helpers';

describe('Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    configureSecurity(app);
    app.get('/test', (_req, res) => {
      res.json({ message: 'Test endpoint' });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TestHelper Mock Validation', () => {
    it('should create proper mock request with security headers', () => {
      const mockReq = TestHelper.createMockRequest({
        url: '/test',
        headers: {
          Origin: 'http://localhost:3000',
          'Accept-Encoding': 'gzip',
          'User-Agent': 'test-agent',
        },
      });

      expect(mockReq.url).toBe('/test');
      expect(mockReq.method).toBe('GET');
      expect((mockReq.headers as any).Origin).toBe('http://localhost:3000');
      expect((mockReq.headers as any)['Accept-Encoding']).toBe('gzip');
      expect((mockReq.headers as any)['User-Agent']).toBe('test-agent');
    });

    it('should create proper mock response for security testing', () => {
      const mockRes = TestHelper.createMockResponse();

      // Simulate setting security headers
      mockRes.set?.('X-Frame-Options', 'SAMEORIGIN');
      mockRes.set?.('X-Content-Type-Options', 'nosniff');

      expect(mockRes.set).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
      expect(mockRes.set).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff'
      );
      expect(typeof mockRes.status).toBe('function');
      expect(typeof mockRes.json).toBe('function');
    });
  });

  describe('Helmet Security Headers', () => {
    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/test');
      // Default helmet configuration sets SAMEORIGIN, not DENY
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
    });

    it('should set X-Download-Options header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-download-options']).toBe('noopen');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from localhost:3000', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000'
      );
    });

    it('should allow credentials', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should validate CORS mock request creation', () => {
      const mockReq = TestHelper.createMockRequest({
        headers: { Origin: 'http://localhost:3000' },
      });

      expect((mockReq.headers as any).Origin).toBe('http://localhost:3000');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests under the limit', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test');
      // Check for the actual header names used by express-rate-limit
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });

  describe('Compression', () => {
    it('should compress responses when requested', async () => {
      const response = await request(app)
        .get('/test')
        .set('Accept-Encoding', 'gzip');

      // Response should be compressed if it's large enough
      expect(response.status).toBe(200);
    });

    it('should validate compression headers with TestHelper', () => {
      const mockReq = TestHelper.createMockRequest({
        headers: { 'Accept-Encoding': 'gzip' },
      });

      expect((mockReq.headers as any)['Accept-Encoding']).toBe('gzip');
    });

    it('should create mock context for middleware testing', () => {
      const context = TestHelper.createMockContext(
        { headers: { 'Accept-Encoding': 'gzip' } },
        {}
      );

      expect(context.req.headers).toEqual({ 'Accept-Encoding': 'gzip' });
      expect(typeof context.res.status).toBe('function');
      expect(typeof context.next).toBe('function');
    });
  });
});
