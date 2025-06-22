import { describe, it, expect, vi } from 'vitest';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { createSpotifyClient } from './client.ts';

// Mock the SpotifyApi
vi.mock('@spotify/web-api-ts-sdk', () => ({
  SpotifyApi: {
    withAccessToken: vi.fn(),
  },
}));

describe('createSpotifyClient', () => {
  it('should create a Spotify client with the provided access token', () => {
    const mockClient = { id: 'mock-client' };
    const accessToken = 'test-access-token';
    
    (SpotifyApi.withAccessToken as any).mockReturnValue(mockClient);

    const result = createSpotifyClient(accessToken);

    expect(result).toBe(mockClient);
    expect(SpotifyApi.withAccessToken).toHaveBeenCalledWith('', {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: '',
    });
  });

  it('should always use Bearer token type', () => {
    const accessToken = 'another-token';
    
    createSpotifyClient(accessToken);

    const callArgs = (SpotifyApi.withAccessToken as any).mock.calls[0];
    expect(callArgs[1].token_type).toBe('Bearer');
  });

  it('should always use 3600 as expires_in', () => {
    const accessToken = 'token-with-expiry';
    
    createSpotifyClient(accessToken);

    const callArgs = (SpotifyApi.withAccessToken as any).mock.calls[0];
    expect(callArgs[1].expires_in).toBe(3600);
  });

  it('should always use empty string for refresh_token', () => {
    const accessToken = 'token-without-refresh';
    
    createSpotifyClient(accessToken);

    const callArgs = (SpotifyApi.withAccessToken as any).mock.calls[0];
    expect(callArgs[1].refresh_token).toBe('');
  });

  it('should always use empty string as client ID', () => {
    const accessToken = 'test-token';
    
    createSpotifyClient(accessToken);

    const callArgs = (SpotifyApi.withAccessToken as any).mock.calls[0];
    expect(callArgs[0]).toBe('');
  });

  it('should handle different access token formats', () => {
    const mockClient = { id: 'mock-client' };
    (SpotifyApi.withAccessToken as any).mockReturnValue(mockClient);

    // Test with a long token
    const longToken = 'a'.repeat(200);
    const result1 = createSpotifyClient(longToken);
    expect(result1).toBe(mockClient);

    // Test with special characters
    const specialToken = 'token-with-special-chars_123.456~789';
    const result2 = createSpotifyClient(specialToken);
    expect(result2).toBe(mockClient);

    // Verify both calls used the correct tokens
    const calls = (SpotifyApi.withAccessToken as any).mock.calls;
    expect(calls[calls.length - 2][1].access_token).toBe(longToken);
    expect(calls[calls.length - 1][1].access_token).toBe(specialToken);
  });
});