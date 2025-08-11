import crypto from 'crypto';

import { env } from '../config';

/**
 * Default avatar generation result
 */
export interface IDefaultAvatarResult {
  url: string;
  provider: string;
  style: string;
  seed: string;
}

/**
 * Avatar Helper Class
 * Provides utilities for generating default avatars and avatar-related operations
 */
export class AvatarHelper {
  /**
   * Generate a default avatar URL for a new user
   * @param identifier - User identifier (username, email, or userId)
   * @param options - Optional configuration for avatar generation
   * @returns Avatar generation result with URL and metadata
   * @example
   * const avatar = AvatarHelper.generateDefaultAvatar('john@example.com');
   *
   */
  public static generateDefaultAvatar(
    identifier: string,
    options?: {
      style?: string;
      size?: number;
      backgroundColor?: string[];
    }
  ): IDefaultAvatarResult {
    const style = options?.style ?? env.DEFAULT_AVATAR_STYLE;
    const size = options?.size ?? 200;
    const backgroundColor = options?.backgroundColor ?? [
      'b6e3f4',
      'c4b5fd',
      'a78bfa',
      'fbbf24',
      'fb7c7c',
      'f472b6',
      '60a5fa',
      '34d399',
    ];


    const seed = crypto
      .createHash('md5')
      .update(identifier.toLowerCase())
      .digest('hex')
      .substring(0, 8);


    const baseUrl = `${env.DEFAULT_AVATAR_BASE_URL}/${style}/svg`;
    const urlParams = new URLSearchParams({
      seed,
      size: size.toString(),
      backgroundColor: backgroundColor.join(','),

      radius: '50',
      scale: '100',
    });

    const url = `${baseUrl}?${urlParams.toString()}`;

    return {
      url,
      provider: env.DEFAULT_AVATAR_PROVIDER,
      style,
      seed,
    };
  }

  /**
   * Generate multiple default avatar options for user selection
   * @param identifier - User identifier (username, email, or userId)
   * @param count - Number of avatar options to generate (default: 4)
   * @returns Array of avatar generation results
   * @example
   * const avatars = AvatarHelper.generateAvatarOptions('john@example.com', 3);
   *
   */
  public static generateAvatarOptions(
    identifier: string,
    count: number = 4
  ): IDefaultAvatarResult[] {
    const styles = ['avataaars', 'micah', 'adventurer', 'big-smile'];
    const options: IDefaultAvatarResult[] = [];

    for (let i = 0; i < Math.min(count, styles.length); i++) {

      const variation = `${identifier}-${i}`;
      options.push(this.generateDefaultAvatar(variation, { style: styles[i] }));
    }

    return options;
  }

  /**
   * Validate avatar URL format
   * @param url - Avatar URL to validate
   * @returns True if URL appears to be a valid avatar URL
   * @example
   * const isValid = AvatarHelper.isValidAvatarUrl('https://example.com/avatar.jpg');
   */
  public static isValidAvatarUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const validExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.svg',
      ];
      const validDomains = [
        'api.dicebear.com',
        'avatars.dicebear.com',
        'ui-avatars.com',
        'robohash.org',
        'gravatar.com',
      ];


      const isDomainValid = validDomains.some((domain) =>
        parsedUrl.hostname.includes(domain)
      );


      const hasValidExtension = validExtensions.some((ext) =>
        parsedUrl.pathname.toLowerCase().includes(ext)
      );

      return isDomainValid || hasValidExtension;
    } catch {
      return false;
    }
  }

  /**
   * Extract initials from user's name for fallback avatar generation
   * @param name - Full name or username
   * @param maxLength - Maximum number of initials (default: 2)
   * @returns Initials string in uppercase
   * @example
   * const initials = AvatarHelper.extractInitials('John Doe Smith');
   */
  public static extractInitials(name: string, maxLength: number = 2): string {
    if (!name || typeof name !== 'string') return 'U';

    const words = name
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length === 0) return 'U';


    const initials = words
      .slice(0, maxLength)
      .map((word) => word[0].toUpperCase())
      .join('');

    return initials || 'U';
  }

  /**
   * Generate a text-based avatar URL using UI Avatars service
   * @param name - Name to generate initials from
   * @param options - Customization options
   * @returns Text avatar URL
   * @example
   * const avatarUrl = AvatarHelper.generateTextAvatar('John Doe', {
   *   background: 'ff6b6b',
   *   color: 'ffffff'
   * });
   */
  public static generateTextAvatar(
    name: string,
    options?: {
      size?: number;
      background?: string;
      color?: string;
      fontSize?: number;
      rounded?: boolean;
    }
  ): string {
    const initials = this.extractInitials(name);
    const size = options?.size ?? 200;
    const background = options?.background ?? '3B82F6';
    const color = options?.color ?? 'FFFFFF';
    const fontSize = options?.fontSize ?? 0.33;
    const rounded = options?.rounded ?? true;

    const params = new URLSearchParams({
      name: initials,
      size: size.toString(),
      background: background.replace('#', ''),
      color: color.replace('#', ''),
      font_size: fontSize.toString(),
      rounded: rounded.toString(),
    });

    return `https://ui-avatars.com/api/?${params.toString()}`;
  }

  /**
   * Get avatar configuration for the application
   * @returns Avatar configuration object
   */
  public static getAvatarConfig(): {
    provider: string;
    baseUrl: string;
    defaultStyle: string;
    supportedStyles: string[];
  } {
    return {
      provider: env.DEFAULT_AVATAR_PROVIDER,
      baseUrl: env.DEFAULT_AVATAR_BASE_URL,
      defaultStyle: env.DEFAULT_AVATAR_STYLE,
      supportedStyles: ['avataaars', 'micah', 'adventurer', 'big-smile'],
    };
  }
}
