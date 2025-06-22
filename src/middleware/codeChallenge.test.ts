import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Context } from 'hono';
import { codeChallengeMiddleware } from './codeChallenge.ts';

// Mock the storage module
vi.mock('../storage/index.ts', () => ({
  getCodeChallengeStorage: vi.fn().mockReturnValue({
    store: vi.fn(),
    get: vi.fn(),
    clear: vi.fn(),
  }),
}));

describe('codeChallengeMiddleware', () => {
  let mockContext: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      set: vi.fn(),
    };

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  it('should set codeChallengeStorage in context', async () => {
    await codeChallengeMiddleware(mockContext as Context, mockNext);

    expect(mockContext.set).toHaveBeenCalledTimes(1);
    expect(mockContext.set).toHaveBeenCalledWith(
      'codeChallengeStorage',
      expect.objectContaining({
        store: expect.any(Function),
        get: expect.any(Function),
        clear: expect.any(Function),
      }),
    );
  });

  it('should call next', async () => {
    await codeChallengeMiddleware(mockContext as Context, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should preserve middleware chain order', async () => {
    const callOrder: string[] = [];

    mockContext.set.mockImplementation(() => {
      callOrder.push('set');
    });

    mockNext.mockImplementation(async () => {
      callOrder.push('next');
    });

    await codeChallengeMiddleware(mockContext as Context, mockNext);

    expect(callOrder).toEqual(['set', 'next']);
  });

  it('should handle errors from next', async () => {
    const error = new Error('Next middleware error');
    mockNext.mockRejectedValue(error);

    await expect(codeChallengeMiddleware(mockContext as Context, mockNext)).rejects.toThrow(
      'Next middleware error',
    );
  });

  it('should always set the same storage instance', async () => {
    const { getCodeChallengeStorage } = await import('../storage/index.ts');
    const mockStorage = { store: vi.fn(), get: vi.fn(), clear: vi.fn() };
    (getCodeChallengeStorage as any).mockReturnValue(mockStorage);

    await codeChallengeMiddleware(mockContext as Context, mockNext);

    expect(mockContext.set).toHaveBeenCalledWith('codeChallengeStorage', mockStorage);
  });
});
