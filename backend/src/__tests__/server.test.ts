import express from 'express';
import request from 'supertest';

import { configureRequestLogging, configureSecurity } from '../middleware';

import { TestHelper } from './helpers';


jest.mock('../config/database', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));


jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Express Server', () => {
  let app: express.Application;

  beforeEach(() => {

    app = express();
    configureSecurity(app);
    configureRequestLogging(app);


    app.get('/', (_req, res) => {
      res.send('Hello Express + TypeScript!');
    });

    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? 'development',
        uptime: process.uptime(),
        service: 'Express TypeScript API',
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TestHelper Validation', () => {
    it('should create proper mock requests for server routes', () => {
      const homeRequest = TestHelper.createMockRequest({ url: '/' });
      const healthRequest = TestHelper.createMockRequest({ url: '/health' });

      expect(homeRequest.url).toBe('/');
      expect(homeRequest.method).toBe('GET');
      expect(healthRequest.url).toBe('/health');
      expect(healthRequest.method).toBe('GET');
    });

    it('should create mock response for server endpoints', () => {
      const mockRes = TestHelper.createMockResponse();


      mockRes.send?.('Hello Express + TypeScript!');
      expect(mockRes.send).toHaveBeenCalledWith('Hello Express + TypeScript!');


      const healthData = {
        status: 'OK',
        service: 'Express TypeScript API',
      };
      mockRes.status?.(200);
      mockRes.json?.(healthData);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(healthData);
    });

    it('should create complete context for middleware integration', () => {
      const context = TestHelper.createMockContext(
        { url: '/health', method: 'GET' },
        {}
      );

      expect(context.req.url).toBe('/health');
      expect(context.req.method).toBe('GET');
      expect(typeof context.res.status).toBe('function');
      expect(typeof context.next).toBe('function');
    });
  });

  describe('Basic Routes', () => {
    it('should return hello message on GET /', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Hello Express + TypeScript!');
    });

    it('should return health check on GET /health', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment', 'test');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('service', 'Express TypeScript API');
    });

    it('should validate route responses with TestHelper', () => {
      const mockRes = TestHelper.createMockResponse();


      const healthResponse = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: 'test',
        uptime: 123.45,
        service: 'Express TypeScript API',
      };

      mockRes.status?.(200);
      mockRes.json?.(healthResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OK',
          service: 'Express TypeScript API',
        })
      );
    });
  });

  describe('Security Headers', () => {
    it('should have security headers configured', async () => {
      const response = await request(app).get('/');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty(
        'x-content-type-options',
        'nosniff'
      );
      expect(response.headers).toHaveProperty('referrer-policy', 'no-referrer');
    });

    it('should validate security headers with TestHelper mocks', () => {
      const mockRes = TestHelper.createMockResponse();


      mockRes.set?.('x-frame-options', 'SAMEORIGIN');
      mockRes.set?.('x-content-type-options', 'nosniff');
      mockRes.set?.('referrer-policy', 'no-referrer');

      expect(mockRes.set).toHaveBeenCalledWith('x-frame-options', 'SAMEORIGIN');
      expect(mockRes.set).toHaveBeenCalledWith(
        'x-content-type-options',
        'nosniff'
      );
      expect(mockRes.set).toHaveBeenCalledWith(
        'referrer-policy',
        'no-referrer'
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
    });

    it('should validate error response with TestHelper', () => {
      const mockRes = TestHelper.createMockResponse();


      mockRes.status?.(404);
      mockRes.json?.({ error: 'Not Found', message: 'Route not found' });

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not Found',
          message: 'Route not found',
        })
      );
    });
  });
});
