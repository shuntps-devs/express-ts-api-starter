import i18next from 'i18next';
import { Resend } from 'resend';
import { Logger } from 'winston';

import { env, logger } from '../config';
import { t } from '../i18n';
import {
  EmailTemplate,
  IEmailConfig,
  IEmailOptions,
  IEmailServiceResponse,
  IEmailTemplateVariables,
} from '../interfaces';

/**
 * Email Service using Resend
 * Handles all email sending functionality with templates
 */
export class EmailService {
  private resend: Resend;
  private config: IEmailConfig;

  constructor() {
    this.config = {
      apiKey: env.RESEND_API_KEY,
      fromEmail: env.EMAIL_FROM ?? 'noreply@yourdomain.com',
      fromName: env.EMAIL_FROM_NAME ?? 'Express TypeScript Starter',
      replyToEmail: env.EMAIL_REPLY_TO ?? 'support@yourdomain.com',
      verificationBaseUrl: env.FRONTEND_URL ?? 'http://localhost:3000',
      supportEmail: env.EMAIL_SUPPORT ?? 'support@yourdomain.com',
      appName: env.APP_NAME ?? 'Express TypeScript Starter',
    };

    this.resend = new Resend(this.config.apiKey);
  }

  /**
   * Helper method to get translation for specific language
   * @param key - Translation key
   * @param language - Target language
   * @param params - Translation parameters
   * @returns Translated string
   */
  private getTranslation(
    key: string,
    language: 'en' | 'fr',
    params?: Record<string, unknown>
  ): string {
    return i18next.t(key, { ...params, lng: language });
  }

  /**
   * Send email with Resend
   * @param options - Email options
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<IEmailServiceResponse>
   */
  public async sendEmail(
    options: IEmailOptions,
    contextLogger?: Logger
  ): Promise<IEmailServiceResponse> {
    const requestLogger = contextLogger ?? logger;

    try {
      requestLogger.info(t('email.service.sending'), {
        to: options.to,
        subject: options.subject,
        from:
          options.from ?? `${this.config.fromName} <${this.config.fromEmail}>`,
      });

      const result = await this.resend.emails.send({
        from:
          options.from ?? `${this.config.fromName} <${this.config.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo ?? this.config.replyToEmail,
        attachments: options.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType,
          encoding: attachment.encoding,
        })),
      });

      if (result.error) {
        requestLogger.error(t('email.service.sendingFailed'), {
          error: result.error,
          to: options.to,
          subject: options.subject,
        });

        return {
          id: '',
          success: false,
          message: t('email.service.sendFailure'),
          error: result.error.message,
        };
      }

      requestLogger.info(t('email.service.sendSuccess'), {
        emailId: result.data?.id,
        to: options.to,
        subject: options.subject,
      });

      return {
        id: result.data?.id || '',
        success: true,
        message: t('email.service.sendSuccess'),
      };
    } catch (error) {
      requestLogger.error(t('email.service.serviceError'), {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        to: options.to,
        subject: options.subject,
      });

      return {
        id: '',
        success: false,
        message: t('email.service.serviceError'),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email verification email
   * @param email - User email
   * @param username - User username
   * @param token - Verification token
   * @param language - Email language (en|fr)
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<IEmailServiceResponse>
   */
  public async sendVerificationEmail(
    email: string,
    username: string,
    token: string,
    language: 'en' | 'fr' = 'en',
    contextLogger?: Logger
  ): Promise<IEmailServiceResponse> {
    const verificationLink = `${this.config.verificationBaseUrl}/verify-email?token=${token}`;

    const templateData: IEmailTemplateVariables[EmailTemplate.VERIFICATION] = {
      username,
      verificationLink,
      expirationTime: '24 hours',
      appName: this.config.appName,
      supportEmail: this.config.supportEmail,
    };

    const { subject, html, text } = this.getEmailTemplate(
      EmailTemplate.VERIFICATION,
      templateData,
      language
    );

    return this.sendEmail(
      {
        to: email,
        subject,
        html,
        text,
      },
      contextLogger
    );
  }

  /**
   * Send welcome email after verification
   * @param email - User email
   * @param username - User username
   * @param language - Email language (en|fr)
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<IEmailServiceResponse>
   */
  public async sendWelcomeEmail(
    email: string,
    username: string,
    language: 'en' | 'fr' = 'en',
    contextLogger?: Logger
  ): Promise<IEmailServiceResponse> {
    const templateData: IEmailTemplateVariables[EmailTemplate.WELCOME] = {
      username,
      appName: this.config.appName,
      supportEmail: this.config.supportEmail,
      loginLink: `${this.config.verificationBaseUrl}/login`,
    };

    const { subject, html, text } = this.getEmailTemplate(
      EmailTemplate.WELCOME,
      templateData,
      language
    );

    return this.sendEmail(
      {
        to: email,
        subject,
        html,
        text,
      },
      contextLogger
    );
  }

  /**
   * Send password reset email
   * @param email - User email
   * @param username - User username
   * @param token - Reset token
   * @param language - Email language (en|fr)
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<IEmailServiceResponse>
   */
  public async sendPasswordResetEmail(
    email: string,
    username: string,
    token: string,
    language: 'en' | 'fr' = 'en',
    contextLogger?: Logger
  ): Promise<IEmailServiceResponse> {
    const resetLink = `${this.config.verificationBaseUrl}/reset-password?token=${token}`;

    const templateData: IEmailTemplateVariables[EmailTemplate.PASSWORD_RESET] =
      {
        username,
        resetLink,
        expirationTime: '10 minutes',
        appName: this.config.appName,
        supportEmail: this.config.supportEmail,
      };

    const { subject, html, text } = this.getEmailTemplate(
      EmailTemplate.PASSWORD_RESET,
      templateData,
      language
    );

    return this.sendEmail(
      {
        to: email,
        subject,
        html,
        text,
      },
      contextLogger
    );
  }

  /**
   * Get email template content
   * @param template - Template type
   * @param data - Template data
   * @param language - Language (en|fr)
   * @returns Template content
   */
  private getEmailTemplate(
    template: EmailTemplate,
    data: IEmailTemplateVariables[typeof template],
    language: 'en' | 'fr'
  ): { subject: string; html: string; text: string } {
    switch (template) {
      case EmailTemplate.VERIFICATION:
        return this.getVerificationTemplate(
          data as IEmailTemplateVariables[EmailTemplate.VERIFICATION],
          language
        );
      case EmailTemplate.WELCOME:
        return this.getWelcomeTemplate(
          data as IEmailTemplateVariables[EmailTemplate.WELCOME],
          language
        );
      case EmailTemplate.PASSWORD_RESET:
        return this.getPasswordResetTemplate(
          data as IEmailTemplateVariables[EmailTemplate.PASSWORD_RESET],
          language
        );
      default:
        throw new Error(`Unsupported email template: ${template}`);
    }
  }

  /**
   * Get email verification template
   */
  private getVerificationTemplate(
    data: IEmailTemplateVariables[EmailTemplate.VERIFICATION],
    language: 'en' | 'fr'
  ): { subject: string; html: string; text: string } {
    return {
      subject: this.getTranslation('email.verification.subject', language, {
        appName: data.appName,
      }),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${this.getTranslation('email.verification.title', language)}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">${this.getTranslation('email.verification.greeting', language, { username: data.username })},</h2>
              <p>${this.getTranslation('email.verification.intro', language, { appName: data.appName })}!</p>
              <p>${this.getTranslation('email.verification.instruction', language)}:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationLink}" 
                   style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  ${this.getTranslation('email.verification.button', language)}
                </a>
              </div>
              <p>${this.getTranslation('email.verification.expiration', language, { time: data.expirationTime })}.</p>
              <p>${this.getTranslation('email.verification.ignore', language)}.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 14px; color: #666;">
                ${this.getTranslation('email.verification.buttonFallback', language)}: <br>
                <a href="${data.verificationLink}">${data.verificationLink}</a>
              </p>
              <p style="font-size: 14px; color: #666;">
                ${this.getTranslation('email.verification.support', language)}: ${data.supportEmail}
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        ${this.getTranslation('email.verification.greeting', language, { username: data.username })},
        
        ${this.getTranslation('email.verification.intro', language, { appName: data.appName })}!
        
        ${this.getTranslation('email.verification.instruction', language)}:
        ${data.verificationLink}
        
        ${this.getTranslation('email.verification.expiration', language, { time: data.expirationTime })}.
        
        ${this.getTranslation('email.verification.ignore', language)}.
        
        ${this.getTranslation('email.verification.support', language)}: ${data.supportEmail}
      `,
    };
  }

  /**
   * Get welcome email template
   */
  private getWelcomeTemplate(
    data: IEmailTemplateVariables[EmailTemplate.WELCOME],
    language: 'en' | 'fr'
  ): { subject: string; html: string; text: string } {
    return {
      subject: this.getTranslation('email.welcome.subject', language, {
        appName: data.appName,
      }),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${this.getTranslation('email.welcome.title', language)}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #27ae60;">${this.getTranslation('email.welcome.greeting', language, { username: data.username })} 🎉</h2>
              <p>${this.getTranslation('email.welcome.intro', language)}!</p>
              <p>${this.getTranslation('email.welcome.instruction', language, { appName: data.appName })}.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginLink}" 
                   style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  ${this.getTranslation('email.welcome.button', language)}
                </a>
              </div>
              <p>${this.getTranslation('email.welcome.support', language)}: ${data.supportEmail}</p>
            </div>
          </body>
        </html>
      `,
      text: `
        ${this.getTranslation('email.welcome.greeting', language, { username: data.username })}
        
        ${this.getTranslation('email.welcome.intro', language)}!
        
        ${this.getTranslation('email.welcome.button', language)}: ${data.loginLink}
        
        ${this.getTranslation('email.welcome.support', language)}: ${data.supportEmail}
      `,
    };
  }

  /**
   * Get password reset email template
   */
  private getPasswordResetTemplate(
    data: IEmailTemplateVariables[EmailTemplate.PASSWORD_RESET],
    language: 'en' | 'fr'
  ): { subject: string; html: string; text: string } {
    return {
      subject: this.getTranslation('email.passwordReset.subject', language, {
        appName: data.appName,
      }),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${this.getTranslation('email.passwordReset.title', language)}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #e74c3c;">${this.getTranslation('email.passwordReset.title', language)}</h2>
              <p>${this.getTranslation('email.passwordReset.greeting', language, { username: data.username })},</p>
              <p>${this.getTranslation('email.passwordReset.intro', language, { appName: data.appName })}.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetLink}" 
                   style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  ${this.getTranslation('email.passwordReset.button', language)}
                </a>
              </div>
              <p>${this.getTranslation('email.passwordReset.expiration', language, { time: data.expirationTime })}.</p>
              <p>${this.getTranslation('email.passwordReset.ignore', language)}.</p>
              <p>${this.getTranslation('email.passwordReset.support', language)}: ${data.supportEmail}</p>
            </div>
          </body>
        </html>
      `,
      text: `
        ${this.getTranslation('email.passwordReset.greeting', language, { username: data.username })},
        
        ${this.getTranslation('email.passwordReset.button', language)}: ${data.resetLink}
        
        ${this.getTranslation('email.passwordReset.expiration', language, { time: data.expirationTime })}.
        
        ${this.getTranslation('email.passwordReset.support', language)}: ${data.supportEmail}
      `,
    };
  }
}
