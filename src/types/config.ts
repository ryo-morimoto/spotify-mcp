/**
 * Application configuration type definitions
 *
 * Types for runtime configuration and environment settings.
 */

/**
 * Application configuration object
 * Contains all runtime settings and environment variables
 */
export interface AppConfig {
  spotifyClientId: string;
  spotifyClientSecret?: string; // Optional for PKCE flow
  port: number;
}
