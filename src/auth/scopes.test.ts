import { describe, it, expect } from 'vitest';
import {
  REQUIRED_SCOPES,
  OPTIONAL_SCOPES,
  hasRequiredScopes,
  getMissingRequiredScopes,
  hasScope,
  buildScopeString,
  parseScopeString,
  needsReauthentication,
} from './scopes.ts';

describe('Scope Management', () => {
  describe('Constants', () => {
    it('should have correct required scopes', () => {
      expect(REQUIRED_SCOPES).toEqual([
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
      ]);
    });

    it('should have correct optional scopes', () => {
      expect(OPTIONAL_SCOPES).toContain('playlist-read-private');
      expect(OPTIONAL_SCOPES).toContain('playlist-modify-public');
      expect(OPTIONAL_SCOPES).toContain('user-library-read');
      expect(OPTIONAL_SCOPES).toHaveLength(8);
    });
  });

  describe('hasRequiredScopes', () => {
    it('should return true when all required scopes are present', () => {
      const grantedScopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'playlist-read-private',
      ];

      expect(hasRequiredScopes(grantedScopes)).toBe(true);
    });

    it('should return false when missing a required scope', () => {
      const grantedScopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        // Missing 'user-read-currently-playing'
      ];

      expect(hasRequiredScopes(grantedScopes)).toBe(false);
    });

    it('should return false with empty array', () => {
      expect(hasRequiredScopes([])).toBe(false);
    });

    it('should return true with exact required scopes', () => {
      expect(hasRequiredScopes([...REQUIRED_SCOPES])).toBe(true);
    });
  });

  describe('getMissingRequiredScopes', () => {
    it('should return empty array when all required scopes are present', () => {
      const grantedScopes = [...REQUIRED_SCOPES, 'playlist-read-private'];

      expect(getMissingRequiredScopes(grantedScopes)).toEqual([]);
    });

    it('should return missing required scopes', () => {
      const grantedScopes = ['user-read-playback-state'];

      const missing = getMissingRequiredScopes(grantedScopes);
      expect(missing).toContain('user-modify-playback-state');
      expect(missing).toContain('user-read-currently-playing');
      expect(missing).toHaveLength(2);
    });

    it('should return all required scopes when none are granted', () => {
      expect(getMissingRequiredScopes([])).toEqual(REQUIRED_SCOPES);
    });

    it('should ignore non-required scopes', () => {
      const grantedScopes = ['playlist-read-private', 'user-library-read'];

      expect(getMissingRequiredScopes(grantedScopes)).toEqual(REQUIRED_SCOPES);
    });
  });

  describe('hasScope', () => {
    const grantedScopes = [
      'user-read-playback-state',
      'playlist-read-private',
      'user-library-read',
    ];

    it('should return true for granted scope', () => {
      expect(hasScope(grantedScopes, 'user-read-playback-state')).toBe(true);
      expect(hasScope(grantedScopes, 'playlist-read-private')).toBe(true);
    });

    it('should return false for non-granted scope', () => {
      expect(hasScope(grantedScopes, 'user-modify-playback-state')).toBe(false);
      expect(hasScope(grantedScopes, 'playlist-modify-public')).toBe(false);
    });

    it('should work with empty array', () => {
      expect(hasScope([], 'user-read-playback-state')).toBe(false);
    });
  });

  describe('buildScopeString', () => {
    it('should return only required scopes by default', () => {
      const scopeString = buildScopeString();
      const scopes = scopeString.split(' ');

      expect(scopes).toHaveLength(REQUIRED_SCOPES.length);
      REQUIRED_SCOPES.forEach(scope => {
        expect(scopes).toContain(scope);
      });
    });

    it('should include optional scopes when requested', () => {
      const scopeString = buildScopeString(true);
      const scopes = scopeString.split(' ');

      expect(scopes).toHaveLength(REQUIRED_SCOPES.length + OPTIONAL_SCOPES.length);
      [...REQUIRED_SCOPES, ...OPTIONAL_SCOPES].forEach(scope => {
        expect(scopes).toContain(scope);
      });
    });

    it('should include additional scopes', () => {
      const additional = ['streaming', 'user-read-email'];
      const scopeString = buildScopeString(false, additional);
      const scopes = scopeString.split(' ');

      expect(scopes).toContain('streaming');
      expect(scopes).toContain('user-read-email');
      expect(scopes).toHaveLength(REQUIRED_SCOPES.length + 2);
    });

    it('should remove duplicate scopes', () => {
      const additional = ['user-read-playback-state', 'streaming'];
      const scopeString = buildScopeString(false, additional);
      const scopes = scopeString.split(' ');

      // Should not have duplicates
      const scopeCount = scopes.filter(s => s === 'user-read-playback-state').length;
      expect(scopeCount).toBe(1);
      expect(scopes).toHaveLength(REQUIRED_SCOPES.length + 1); // Only 'streaming' is new
    });

    it('should handle all options together', () => {
      const additional = ['streaming', 'user-read-email'];
      const scopeString = buildScopeString(true, additional);
      const scopes = scopeString.split(' ');

      // Should have all unique scopes
      const expectedLength = REQUIRED_SCOPES.length + OPTIONAL_SCOPES.length + 2;
      expect(scopes).toHaveLength(expectedLength);
    });

    it('should handle empty additional scopes array', () => {
      const scopeString = buildScopeString(false, []);
      expect(scopeString).toBe(REQUIRED_SCOPES.join(' '));
    });
  });

  describe('parseScopeString', () => {
    it('should parse space-separated scope string', () => {
      const scopeString = 'user-read-playback-state user-modify-playback-state playlist-read-private';
      const scopes = parseScopeString(scopeString);

      expect(scopes).toEqual([
        'user-read-playback-state',
        'user-modify-playback-state',
        'playlist-read-private',
      ]);
    });

    it('should handle empty string', () => {
      expect(parseScopeString('')).toEqual([]);
    });

    it('should handle single scope', () => {
      expect(parseScopeString('user-read-playback-state')).toEqual(['user-read-playback-state']);
    });

    it('should filter out empty strings from multiple spaces', () => {
      const scopeString = 'user-read-playback-state  user-modify-playback-state   ';
      const scopes = parseScopeString(scopeString);

      expect(scopes).toEqual([
        'user-read-playback-state',
        'user-modify-playback-state',
      ]);
    });

    it('should handle leading and trailing spaces', () => {
      const scopeString = '  user-read-playback-state user-modify-playback-state  ';
      const scopes = parseScopeString(scopeString);

      expect(scopes).toEqual([
        'user-read-playback-state',
        'user-modify-playback-state',
      ]);
    });
  });

  describe('needsReauthentication', () => {
    it('should return false when all required scopes are present', () => {
      const currentScopes = ['user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private'];
      const requiredScopes = ['user-read-playback-state', 'user-modify-playback-state'];

      expect(needsReauthentication(currentScopes, requiredScopes)).toBe(false);
    });

    it('should return true when missing required scopes', () => {
      const currentScopes = ['user-read-playback-state'];
      const requiredScopes = ['user-read-playback-state', 'user-modify-playback-state'];

      expect(needsReauthentication(currentScopes, requiredScopes)).toBe(true);
    });

    it('should return false with empty required scopes', () => {
      const currentScopes = ['user-read-playback-state'];
      
      expect(needsReauthentication(currentScopes, [])).toBe(false);
    });

    it('should return true with empty current scopes', () => {
      const requiredScopes = ['user-read-playback-state'];
      
      expect(needsReauthentication([], requiredScopes)).toBe(true);
    });

    it('should return false when both arrays are empty', () => {
      expect(needsReauthentication([], [])).toBe(false);
    });

    it('should work with completely different scope sets', () => {
      const currentScopes = ['playlist-read-private', 'playlist-modify-public'];
      const requiredScopes = ['user-read-playback-state', 'user-modify-playback-state'];

      expect(needsReauthentication(currentScopes, requiredScopes)).toBe(true);
    });
  });
});