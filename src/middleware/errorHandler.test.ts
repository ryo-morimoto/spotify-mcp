import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { errorHandler } from './errorHandler.ts';

describe('errorHandler', () => {
  let mockContext: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      json: vi.fn().mockReturnValue(new Response()),
    };
    
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle HTTPException with status code', () => {
    const httpError = new HTTPException(404, { message: 'Not Found' });
    
    errorHandler(httpError, mockContext as Context);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', httpError);
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        error: 'Not Found',
        status: 404,
      },
      404
    );
  });

  it('should handle HTTPException with custom message', () => {
    const httpError = new HTTPException(401, { message: 'Unauthorized access' });
    
    errorHandler(httpError, mockContext as Context);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        error: 'Unauthorized access',
        status: 401,
      },
      401
    );
  });

  it('should handle generic Error as 500', () => {
    const genericError = new Error('Something went wrong');
    
    errorHandler(genericError, mockContext as Context);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', genericError);
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        error: 'Internal Server Error',
        message: 'Something went wrong',
      },
      500
    );
  });

  it('should handle Error with empty message', () => {
    const emptyError = new Error('');
    
    errorHandler(emptyError, mockContext as Context);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        error: 'Internal Server Error',
        message: '',
      },
      500
    );
  });

  it('should handle custom error types as generic errors', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    
    const customError = new CustomError('Custom error occurred');
    
    errorHandler(customError, mockContext as Context);

    expect(mockContext.json).toHaveBeenCalledWith(
      {
        error: 'Internal Server Error',
        message: 'Custom error occurred',
      },
      500
    );
  });

  it('should log all errors to console', () => {
    const error1 = new HTTPException(400, { message: 'Bad Request' });
    const error2 = new Error('Generic error');
    
    errorHandler(error1, mockContext as Context);
    errorHandler(error2, mockContext as Context);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Error:', error1);
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Error:', error2);
  });

  it('should return Response from context.json', () => {
    const mockResponse = new Response('test');
    mockContext.json.mockReturnValue(mockResponse);
    
    const error = new Error('Test error');
    const result = errorHandler(error, mockContext as Context);

    expect(result).toBe(mockResponse);
  });
});