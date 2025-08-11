import { EmailHelper } from '../../utils';

describe('EmailHelper', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(EmailHelper.isValidEmail('test@example.com')).toBe(true);
      expect(EmailHelper.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(EmailHelper.isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(EmailHelper.isValidEmail('invalid-email')).toBe(false);
      expect(EmailHelper.isValidEmail('@domain.com')).toBe(false);
      expect(EmailHelper.isValidEmail('user@')).toBe(false);
      expect(EmailHelper.isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize email addresses', () => {
      expect(EmailHelper.sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe(
        'test@example.com'
      );
      expect(EmailHelper.sanitizeEmail('User@Domain.Org')).toBe(
        'user@domain.org'
      );
    });
  });

  describe('generateVerificationLink', () => {
    it('should generate correct verification links', () => {
      const token = 'test-token-123';
      const baseUrl = 'https://example.com';
      const expected = 'https://example.com/verify-email?token=test-token-123';

      expect(EmailHelper.generateVerificationLink(token, baseUrl)).toBe(
        expected
      );
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from email', () => {
      expect(EmailHelper.extractDomain('user@example.com')).toBe('example.com');
      expect(EmailHelper.extractDomain('test@subdomain.example.org')).toBe(
        'subdomain.example.org'
      );
    });

    it('should handle invalid emails', () => {
      expect(EmailHelper.extractDomain('invalid-email')).toBe('');
      expect(EmailHelper.extractDomain('')).toBe('');
    });
  });

  describe('isDisposableEmail', () => {
    it('should detect disposable email domains', () => {
      expect(EmailHelper.isDisposableEmail('test@10minutemail.com')).toBe(true);
      expect(EmailHelper.isDisposableEmail('user@tempmail.org')).toBe(true);
      expect(EmailHelper.isDisposableEmail('spam@mailinator.com')).toBe(true);
    });

    it('should allow legitimate email domains', () => {
      expect(EmailHelper.isDisposableEmail('user@gmail.com')).toBe(false);
      expect(EmailHelper.isDisposableEmail('test@company.com')).toBe(false);
      expect(EmailHelper.isDisposableEmail('admin@example.org')).toBe(false);
    });
  });

  describe('formatExpirationTime', () => {
    beforeAll(() => {
      // Mock Date constructor to return a fixed time
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should format expiration time correctly in English', () => {
      const baseTime = new Date('2024-01-01T12:00:00Z');
      const in30Minutes = new Date(baseTime.getTime() + 30 * 60 * 1000);
      const in2Hours = new Date(baseTime.getTime() + 2 * 60 * 60 * 1000);
      const in3Days = new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000);

      expect(EmailHelper.formatExpirationTime(in30Minutes, 'en')).toBe(
        '30 minutes'
      );
      expect(EmailHelper.formatExpirationTime(in2Hours, 'en')).toBe('2 hours');
      expect(EmailHelper.formatExpirationTime(in3Days, 'en')).toBe('3 days');
    });

    it('should format expiration time correctly in French', () => {
      const baseTime = new Date('2024-01-01T12:00:00Z');
      const in1Minute = new Date(baseTime.getTime() + 1 * 60 * 1000);
      const in1Hour = new Date(baseTime.getTime() + 1 * 60 * 60 * 1000);
      const in1Day = new Date(baseTime.getTime() + 25 * 60 * 60 * 1000); // 25 hours to ensure > 24h

      expect(EmailHelper.formatExpirationTime(in1Minute, 'fr')).toBe(
        '1 minute'
      );
      expect(EmailHelper.formatExpirationTime(in1Hour, 'fr')).toBe('1 heure');
      expect(EmailHelper.formatExpirationTime(in1Day, 'fr')).toBe('1 jour');
    });

    it('should handle expired times', () => {
      const past = new Date(Date.now() - 60 * 1000);

      expect(EmailHelper.formatExpirationTime(past, 'en')).toBe('expired');
      expect(EmailHelper.formatExpirationTime(past, 'fr')).toBe('expiré');
    });
  });

  describe('getDisplayName', () => {
    it('should return username if available', () => {
      const user = {
        username: 'johndoe',
        email: 'john@example.com',
      } as any;

      expect(EmailHelper.getDisplayName(user)).toBe('johndoe');
    });

    it('should fallback to email prefix if no username', () => {
      const user = {
        username: '',
        email: 'jane.smith@example.com',
      } as any;

      expect(EmailHelper.getDisplayName(user)).toBe('jane.smith');
    });

    it('should fallback to "User" if all else fails', () => {
      const user = {
        username: '',
        email: '@invalid',
      } as any;

      expect(EmailHelper.getDisplayName(user)).toBe('User');
    });
  });
});
