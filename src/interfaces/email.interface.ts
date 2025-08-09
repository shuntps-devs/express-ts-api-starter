/**
 * Email-related interface definitions
 * Comprehensive interfaces for email service functionality
 */

/**
 * Email template data interface
 * Contains dynamic data to be injected into email templates
 * @interface IEmailTemplateData
 */
export interface IEmailTemplateData {
  /** Recipient's username */
  username: string;
  /** Recipient's email address */
  email: string;
  /** Optional verification link URL */
  verificationLink?: string;
  /** Optional verification code */
  verificationCode?: string;
  /** Optional expiration time string */
  expirationTime?: string;
  /** Application name */
  appName?: string;
  /** Support email address */
  supportEmail?: string;
  /** Additional dynamic properties */
  [key: string]: string | undefined;
}

/**
 * Email sending options interface
 * Configuration for sending emails through email service
 * @interface IEmailOptions
 */
export interface IEmailOptions {
  /** Recipient email address(es) */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** HTML email content */
  html: string;
  /** Optional plain text version */
  text?: string;
  /** Optional sender email override */
  from?: string;
  /** Optional reply-to email address */
  replyTo?: string;
  /** Optional email attachments */
  attachments?: IEmailAttachment[];
}

/**
 * Email attachment interface
 * Defines structure for email file attachments
 * @interface IEmailAttachment
 */
export interface IEmailAttachment {
  /** Attachment filename */
  filename: string;
  /** File content as Buffer or string */
  content: Buffer | string;
  /** MIME content type */
  contentType: string;
  /** Optional content encoding */
  encoding?: string;
}

/**
 * Email template types enumeration
 * Defines available email template types
 */
export enum EmailTemplate {
  /** Email verification template */
  VERIFICATION = 'verification',
  /** Welcome email template */
  WELCOME = 'welcome',
  /** Password reset template */
  PASSWORD_RESET = 'password-reset',
  /** Password change confirmation template */
  PASSWORD_CHANGED = 'password-changed',
}

/**
 * Email service response interface
 * Response structure from email sending operations
 * @interface IEmailServiceResponse
 */
export interface IEmailServiceResponse {
  /** Unique message identifier */
  id: string;
  /** Whether the email was sent successfully */
  success: boolean;
  /** Success or error message */
  message: string;
  /** Optional error details */
  error?: string;
}

/**
 * Email template variables interface
 * Type-safe template variable definitions for each template type
 * @interface IEmailTemplateVariables
 */
export interface IEmailTemplateVariables {
  /** Variables for email verification template */
  [EmailTemplate.VERIFICATION]: {
    /** User's display name */
    username: string;
    /** Email verification link URL */
    verificationLink: string;
    /** Token expiration time string */
    expirationTime: string;
    /** Application name */
    appName: string;
    /** Support contact email */
    supportEmail: string;
  };
  /** Variables for welcome email template */
  [EmailTemplate.WELCOME]: {
    /** User's display name */
    username: string;
    /** Application name */
    appName: string;
    /** Support contact email */
    supportEmail: string;
    /** Login page URL */
    loginLink: string;
  };
  /** Variables for password reset template */
  [EmailTemplate.PASSWORD_RESET]: {
    /** User's display name */
    username: string;
    /** Password reset link URL */
    resetLink: string;
    /** Reset token expiration time */
    expirationTime: string;
    /** Application name */
    appName: string;
    /** Support contact email */
    supportEmail: string;
  };
  /** Variables for password changed confirmation template */
  [EmailTemplate.PASSWORD_CHANGED]: {
    /** User's display name */
    username: string;
    /** Timestamp of password change */
    changeTime: string;
    /** Application name */
    appName: string;
    /** Support contact email */
    supportEmail: string;
    /** Security settings link URL */
    securityLink: string;
  };
}

/**
 * Email configuration interface
 * Configuration settings for email service initialization
 * @interface IEmailConfig
 */
export interface IEmailConfig {
  /** Email service API key */
  apiKey: string;
  /** Default sender email address */
  fromEmail: string;
  /** Default sender display name */
  fromName: string;
  /** Default reply-to email address */
  replyToEmail: string;
  /** Base URL for email verification links */
  verificationBaseUrl: string;
  /** Support contact email address */
  supportEmail: string;
  /** Application display name */
  appName: string;
}
