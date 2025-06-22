import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Context } from 'hono';
import { sessionMiddleware } from './session.ts';

// Mock hono/cookie
vi.mock('hono/cookie', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
  writable: true,
  configurable: true,
});

describe('sessionMiddleware', () => {
  let mockContext: any;
  let mockNext: any;
  let getCookie: any;
  let setCookie: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockContext = {
      set: vi.fn(),
    };
    
    mockNext = vi.fn().mockResolvedValue(undefined);
    
    // Get mocked functions
    const cookieModule = await import('hono/cookie');
    getCookie = cookieModule.getCookie as any;
    setCookie = cookieModule.setCookie as any;
  });

  it('should use existing session ID from cookie', async () => {
    const existingSessionId = 'existing-session-123';
    getCookie.mockReturnValue(existingSessionId);

    await sessionMiddleware(mockContext as Context, mockNext);

    expect(getCookie).toHaveBeenCalledWith(mockContext, 'session_id');
    expect(mockContext.set).toHaveBeenCalledWith('sessionId', existingSessionId);
    expect(setCookie).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate new session ID when none exists', async () => {
    const newSessionId = 'new-session-456';
    getCookie.mockReturnValue(undefined);
    mockRandomUUID.mockReturnValue(newSessionId);

    await sessionMiddleware(mockContext as Context, mockNext);

    expect(getCookie).toHaveBeenCalledWith(mockContext, 'session_id');
    expect(mockRandomUUID).toHaveBeenCalled();
    expect(setCookie).toHaveBeenCalledWith(
      mockContext,
      'session_id',
      newSessionId,
      {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 604800, // 7 days in seconds
      }
    );
    expect(mockContext.set).toHaveBeenCalledWith('sessionId', newSessionId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle empty string as no session', async () => {
    const newSessionId = 'new-session-789';
    getCookie.mockReturnValue('');
    mockRandomUUID.mockReturnValue(newSessionId);

    await sessionMiddleware(mockContext as Context, mockNext);

    // Empty string is falsy in the cookie context, so it will generate new session
    expect(setCookie).toHaveBeenCalled();
    expect(mockContext.set).toHaveBeenCalledWith('sessionId', newSessionId);
  });

  it('should call next after setting session', async () => {
    const callOrder: string[] = [];
    
    getCookie.mockReturnValue('session-123');
    mockContext.set.mockImplementation(() => {
      callOrder.push('set');
    });
    mockNext.mockImplementation(async () => {
      callOrder.push('next');
    });

    await sessionMiddleware(mockContext as Context, mockNext);

    expect(callOrder).toEqual(['set', 'next']);
  });

  it('should propagate errors from next', async () => {
    getCookie.mockReturnValue('session-123');
    const error = new Error('Next middleware error');
    mockNext.mockRejectedValue(error);

    await expect(sessionMiddleware(mockContext as Context, mockNext)).rejects.toThrow(
      'Next middleware error'
    );
  });

  it('should use consistent cookie options', async () => {
    getCookie.mockReturnValue(undefined);
    mockRandomUUID.mockReturnValue('test-session');

    await sessionMiddleware(mockContext as Context, mockNext);

    const cookieOptions = setCookie.mock.calls[0][3];
    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.secure).toBe(false); // Would be true in production
    expect(cookieOptions.sameSite).toBe('Lax');
    expect(cookieOptions.maxAge).toBe(604800); // 7 days
  });
});