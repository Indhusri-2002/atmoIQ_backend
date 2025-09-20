import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Loads environment variables from the specified environment file.
 */
const env = process.env.ENV || 'dev'; // Use NODE_ENV or default to 'development'

const loadConfig = dotenv.config({
  path: path.resolve(__dirname, `../../config/${env}.env`),
});

if (loadConfig.error) {
  throw new Error(`Unable to load environment variables from ${env}.env`);
}

// Uncomment for debugging purposes
// console.log(`Environment variables loaded from ${env}.env`);
// console.log(loadConfig.parsed);

export class ConfigService {
  private static instance: ConfigService;

  // Private constructor to prevent direct instantiation
  private constructor() {}

  /**
   * Returns the singleton instance of the ConfigService class.
   * @returns The ConfigService instance.
   */
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Retrieves the value of the specified configuration key from the environment variables.
   * @param key - The configuration key.
   * @returns The value of the configuration key.
   * @throws Error if the configuration key is missing.
   */
  get(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  }

  /**
   * Retrieves the value of the specified configuration key as a number.
   * @param key - The configuration key.
   * @returns The value as a number.
   * @throws Error if the configuration key is missing or cannot be converted.
   */
  getNumber(key: string): number {
    const value = this.get(key);
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      throw new Error(`Environment variable ${key} is not a valid number`);
    }
    return numberValue;
  }

  /**
   * Retrieves the value of the specified configuration key as a boolean.
   * @param key - The configuration key.
   * @returns The value as a boolean.
   * @throws Error if the configuration key is missing or cannot be converted.
   */
  getBoolean(key: string): boolean {
    const value = this.get(key).toLowerCase();
    if (value !== 'true' && value !== 'false') {
      throw new Error(`Environment variable ${key} is not a valid boolean`);
    }
    return value === 'true';
  }
}
