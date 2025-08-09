import { TranslationKeys, TranslationParams } from '../i18n';

// Message Keys Types
export type MessageKey = TranslationKeys;

// Message Function Type
export type MessageWithParams = (params: TranslationParams) => string;

// Combined Messages Type
export interface IMessages {
  t: <T extends MessageKey>(key: T, params?: TranslationParams) => string;
}
