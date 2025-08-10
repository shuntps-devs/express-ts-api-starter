import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

import { env } from '../config';

import { en, fr } from './locales';

/**
 * Translation resources configuration
 * Contains all available language translations for the application
 */
export const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
} as const;

/**
 * Type-safe translation keys for the application
 * Ensures only valid translation keys can be used with the t() function
 */
export type TranslationKeys =
  | 'api.service.name'
  | 'api.welcome.message'
  | 'server.startup.success'
  | 'server.startup.failure'
  | 'server.shutdown.start'
  | 'server.shutdown.timeout'
  | 'server.shutdown.connections'
  | 'server.shutdown.waiting'
  | 'server.shutdown.success'
  | 'server.shutdown.completed'
  | 'server.shutdown.error'
  | 'database.connected'
  | 'database.error'
  | 'database.disconnected'
  | 'database.connectionFailed'
  | 'database.continuingWithoutDb'
  | 'middleware.requestLoggingConfigured'
  | 'middleware.securityConfigured'
  | 'middleware.rateLimitExceeded'
  | 'auth.invalidToken'
  | 'auth.userNotFound'
  | 'auth.refreshTokenRequired'
  | 'auth.invalidRefreshToken'
  | 'auth.authenticationRequired'
  | 'auth.sessionExpired'
  | 'auth.authenticationError'
  | 'auth.accessTokenRequired'
  | 'auth.invalidOrExpiredToken'
  | 'auth.insufficientPermissions'
  | 'auth.email.alreadyExists'
  | 'auth.email.alreadyVerified'
  | 'auth.username.alreadyExists'
  | 'auth.account.locked'
  | 'auth.account.inactive'
  | 'auth.credentials.invalid'
  | 'auth.token.invalidOrExpired'
  | 'auth.verification.tokenInvalid'
  | 'auth.verification.required'
  | 'auth.verification.requiredWithDays'
  | 'auth.password.resetSent'
  | 'auth.password.resetTokenInvalid'
  | 'success.userCreated'
  | 'success.loginSuccessful'
  | 'success.logoutSuccessful'
  | 'success.logoutAllSuccessful'
  | 'success.tokenRefreshed'
  | 'success.sessionsRetrieved'
  | 'success.profileRetrieved'
  | 'success.resourceCreated'
  | 'success.resourceUpdated'
  | 'success.resourceDeleted'
  | 'success.statisticsRetrieved'
  | 'success.cleanupCompleted'
  | 'success.emailVerified'
  | 'success.verificationEmailSent'
  | 'success.verificationEmailSentIfExists'
  | 'errors.badRequest'
  | 'errors.unauthorized'
  | 'errors.forbidden'
  | 'errors.resourceNotFound'
  | 'errors.conflict'
  | 'errors.validationFailed'
  | 'errors.tooManyRequests'
  | 'errors.internalServerError'
  | 'error.internalServer'
  | 'error.payloadTooLarge'
  | 'error.validation.invalidInput'
  | 'env.validationError'
  | 'validation.email.invalid'
  | 'validation.email.required'
  | 'validation.password.minLength'
  | 'validation.password.complexity'
  | 'validation.password.required'
  | 'validation.password.current'
  | 'validation.username.minLength'
  | 'validation.username.maxLength'
  | 'validation.username.required'
  | 'validation.token.required'
  | 'validation.token.resetRequired'
  | 'validation.token.verificationRequired'
  | 'validation.identifier.required'
  | 'email.verification.subject'
  | 'email.verification.title'
  | 'email.verification.greeting'
  | 'email.verification.intro'
  | 'email.verification.instruction'
  | 'email.verification.button'
  | 'email.verification.expiration'
  | 'email.verification.ignore'
  | 'email.verification.buttonFallback'
  | 'email.verification.support'
  | 'email.welcome.subject'
  | 'email.welcome.title'
  | 'email.welcome.greeting'
  | 'email.welcome.intro'
  | 'email.welcome.instruction'
  | 'email.welcome.button'
  | 'email.welcome.support'
  | 'email.passwordReset.subject'
  | 'email.passwordReset.title'
  | 'email.passwordReset.greeting'
  | 'email.passwordReset.intro'
  | 'email.passwordReset.button'
  | 'email.passwordReset.expiration'
  | 'email.passwordReset.ignore'
  | 'email.passwordReset.support'
  | 'email.service.sendSuccess'
  | 'email.service.sendFailure'
  | 'email.service.sendFailed'
  | 'email.service.serviceError'
  | 'email.service.sending'
  | 'email.service.sendingFailed'
  | 'avatar.directoryCreationFailed'
  | 'avatar.invalidFormat'
  | 'avatar.fileTooLarge'
  | 'avatar.uploadFailed'
  | 'avatar.profileUpdateFailed'
  | 'avatar.removalFailed'
  | 'avatar.uploaded'
  | 'avatar.removed'
  | 'avatar.retrieved'
  | 'avatar.uploadLimits';

/**
 * Initialize internationalization with i18next configuration
 * Sets up language detection, fallbacks, and resource loading
 * @returns Promise that resolves when i18n is fully initialized
 */
export const initI18n = async () => {
  await i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      backend: {
        loadPath: './src/i18n/locales/{{lng}}.ts',
      },
      resources,
      lng: env.DEFAULT_LANGUAGE,
      fallbackLng: 'en',
      preload: ['en', 'fr'],
      supportedLngs: ['en', 'fr'],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['header', 'querystring', 'cookie'],
        lookupHeader: 'accept-language',
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        caches: ['cookie'],
      },
    });
};

/**
 * Translation parameter types for interpolation
 * Supports string, number, and boolean values for template variables
 */
export type TranslationParams = Record<string, string | number | boolean>;

/**
 * Type-safe translation function
 * Provides translations with optional parameter interpolation
 * @param key - Translation key from the available TranslationKeys
 * @param params - Optional parameters for string interpolation
 * @returns Translated string in the current language
 */
export const t = (key: TranslationKeys, params?: TranslationParams): string => {
  return i18next.t(key, params);
};
