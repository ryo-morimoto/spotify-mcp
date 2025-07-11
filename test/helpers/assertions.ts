import { expect } from "vitest";
import type { Result } from "neverthrow";

/**
 * Custom assertion for HTTP response objects
 */
export function expectResponse(response: Response) {
  return {
    toHaveStatus(expectedStatus: number) {
      expect(response.status).toBe(expectedStatus);
      return this;
    },

    toHaveHeader(headerName: string, expectedValue?: string) {
      const actualValue = response.headers.get(headerName);
      expect(actualValue).toBeTruthy();
      if (expectedValue !== undefined) {
        expect(actualValue).toBe(expectedValue);
      }
      return this;
    },

    toHaveContentType(expectedContentType: string) {
      const contentType = response.headers.get("content-type");
      expect(contentType).toContain(expectedContentType);
      return this;
    },

    async toHaveJsonBody<T>(expectedBody?: T) {
      const body = await response.json();
      if (expectedBody !== undefined) {
        expect(body).toEqual(expectedBody);
      }
      return body;
    },

    async toHaveTextBody(expectedText?: string) {
      const text = await response.text();
      if (expectedText !== undefined) {
        expect(text).toBe(expectedText);
      }
      return text;
    },
  };
}

/**
 * Custom assertion for Result types from neverthrow
 */
export function expectResult<T, E>(result: Result<T, E>) {
  return {
    toBeOk() {
      expect(result.isOk()).toBe(true);
      return (result as any).value as T;
    },

    toBeErr() {
      expect(result.isErr()).toBe(true);
      return (result as any).error as E;
    },

    toHaveValue(expectedValue: T) {
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(expectedValue);
      }
      return this;
    },

    toHaveError(expectedError: E) {
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual(expectedError);
      }
      return this;
    },

    toMatchOk(matcher: (value: T) => void) {
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        matcher(result.value);
      }
      return this;
    },

    toMatchErr(matcher: (error: E) => void) {
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        matcher(result.error);
      }
      return this;
    },
  };
}

/**
 * OAuth error response structure
 */
type OAuthErrorResponse = {
  error: string;
  error_description?: string;
  error_uri?: string;
};

/**
 * Custom assertion for OAuth error responses
 */
export function expectOAuthError(response: Response) {
  return {
    async toHaveError(expectedError: string, expectedDescription?: string) {
      expect(response.status).toBeGreaterThanOrEqual(400);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");

      const body = (await response.json()) as OAuthErrorResponse;
      expect(body.error).toBe(expectedError);

      if (expectedDescription !== undefined) {
        expect(body.error_description).toBe(expectedDescription);
      }

      return body;
    },

    async toBeInvalidRequest(expectedDescription?: string) {
      return this.toHaveError("invalid_request", expectedDescription);
    },

    async toBeInvalidClient(expectedDescription?: string) {
      return this.toHaveError("invalid_client", expectedDescription);
    },

    async toBeInvalidGrant(expectedDescription?: string) {
      return this.toHaveError("invalid_grant", expectedDescription);
    },

    async toBeUnauthorizedClient(expectedDescription?: string) {
      return this.toHaveError("unauthorized_client", expectedDescription);
    },

    async toBeUnsupportedGrantType(expectedDescription?: string) {
      return this.toHaveError("unsupported_grant_type", expectedDescription);
    },

    async toBeInvalidScope(expectedDescription?: string) {
      return this.toHaveError("invalid_scope", expectedDescription);
    },

    async toBeAccessDenied(expectedDescription?: string) {
      return this.toHaveError("access_denied", expectedDescription);
    },
  };
}

/**
 * Helper to create assertions for MCP tool results
 */
export function expectToolResult(result: unknown) {
  return {
    toHaveContent(expectedContent: unknown) {
      expect(result).toHaveProperty("content");
      if (expectedContent !== undefined) {
        expect((result as any).content).toEqual(expectedContent);
      }
      return this;
    },

    toBeError(isError = true) {
      expect(result).toHaveProperty("isError", isError);
      return this;
    },

    toHaveTextContent(expectedText: string) {
      expect(result).toHaveProperty("content");
      const content = (result as any).content;
      expect(Array.isArray(content)).toBe(true);
      expect(content.some((item: any) => item.type === "text" && item.text === expectedText)).toBe(
        true,
      );
      return this;
    },
  };
}
