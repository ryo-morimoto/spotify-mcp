import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Context, Next } from 'hono';
import { timingMiddleware } from './timing.ts';

describe('timingMiddleware', () => {
  let mockContext: any;
  let mockNext: any;
  let dateNowSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      header: vi.fn(),
    };

    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (dateNowSpy) {
      dateNowSpy.mockRestore();
    }
  });

  it('should add X-Response-Time header with duration', async () => {
    let callCount = 0;
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      // First call returns start time, second call returns end time
      return callCount++ === 0 ? 1000 : 1050;
    });

    await timingMiddleware(mockContext as Context, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockContext.header).toHaveBeenCalledWith('X-Response-Time', '50ms');
  });

  it('should handle async next middleware', async () => {
    let callCount = 0;
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      return callCount++ === 0 ? 2000 : 2100;
    });

    mockNext.mockImplementation(async () => {
      // Simulate some async work
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await timingMiddleware(mockContext as Context, mockNext);

    expect(mockContext.header).toHaveBeenCalledWith('X-Response-Time', '100ms');
  });

  it('should measure zero duration for instant middleware', async () => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(5000);

    await timingMiddleware(mockContext as Context, mockNext);

    expect(mockContext.header).toHaveBeenCalledWith('X-Response-Time', '0ms');
  });

  it('should propagate errors from next middleware', async () => {
    const error = new Error('Next middleware failed');
    mockNext.mockRejectedValue(error);

    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);

    await expect(timingMiddleware(mockContext as Context, mockNext)).rejects.toThrow(
      'Next middleware failed',
    );

    // Should not set header when error occurs
    expect(mockContext.header).not.toHaveBeenCalled();
  });

  it('should handle long running requests', async () => {
    let callCount = 0;
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      return callCount++ === 0 ? 0 : 5432;
    });

    await timingMiddleware(mockContext as Context, mockNext);

    expect(mockContext.header).toHaveBeenCalledWith('X-Response-Time', '5432ms');
  });

  it('should call next before setting header', async () => {
    const callOrder: string[] = [];

    mockNext.mockImplementation(async () => {
      callOrder.push('next');
    });

    mockContext.header.mockImplementation(() => {
      callOrder.push('header');
    });

    await timingMiddleware(mockContext as Context, mockNext);

    expect(callOrder).toEqual(['next', 'header']);
  });
});
