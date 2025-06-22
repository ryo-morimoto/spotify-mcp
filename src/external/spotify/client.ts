import { SpotifyApi, type AccessToken } from '@spotify/web-api-ts-sdk';

/**
 * Create Spotify SDK client with access token
 * Uses withAccessToken for cases where we already have a token
 */
export function createSpotifyClient(accessToken: string): SpotifyApi {
  const tokenObject: AccessToken = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: '',
  };
  return SpotifyApi.withAccessToken('', tokenObject);
}
