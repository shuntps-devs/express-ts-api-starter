import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

import { env } from '../config/env';

import { en } from './locales/en';
import { fr } from './locales/fr';

export const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
} as const;

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
  | 'auth.invalidToken'
  | 'auth.userNotFound'
  | 'auth.refreshTokenRequired'
  | 'auth.invalidRefreshToken'
  | 'auth.email.alreadyExists'
  | 'auth.email.alreadyVerified'
  | 'auth.username.alreadyExists'
  | 'auth.account.locked'
  | 'auth.credentials.invalid'
  | 'auth.verification.tokenInvalid'
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
  | 'errors.badRequest'
  | 'errors.unauthorized'
  | 'errors.forbidden'
  | 'errors.resourceNotFound'
  | 'errors.conflict'
  | 'errors.validationFailed'
  | 'errors.tooManyRequests'
  | 'errors.internalServerError'
  | 'error.internalServer'
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
  | 'validation.identifier.required';

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

export type TranslationParams = Record<string, string | number | boolean>;

export const t = (key: TranslationKeys, params?: TranslationParams): string => {
  return i18next.t(key, params);
};
