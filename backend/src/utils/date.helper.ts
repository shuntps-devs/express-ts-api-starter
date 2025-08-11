export class DateHelper {
  /**
   * Get current date
   * @returns Current Date instance
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Get current timestamp in milliseconds
   * @returns Current timestamp
   */
  static timestamp(): number {
    return Date.now();
  }

  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    // Date formatting logic
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day);
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static isExpired(date: Date): boolean {
    return date < new Date();
  }
}
