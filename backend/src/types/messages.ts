import { TranslationKeys, TranslationParams } from '../i18n';

export type MessageKey = TranslationKeys;

export type MessageWithParams = (params: TranslationParams) => string;

export interface IMessages {
  t: <T extends MessageKey>(key: T, params?: TranslationParams) => string;
}
