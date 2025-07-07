import { describe, it, expect } from "vitest";
import { safeDivide, calculatePercentage, fetchUserData } from "./exampleResult.ts";

describe("safeDivide", () => {
  it("should divide two numbers successfully", () => {
    const result = safeDivide(10, 2);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(5);
    }
  });

  it("should return error when dividing by zero", () => {
    const result = safeDivide(10, 0);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Division by zero");
    }
  });

  it("should handle negative numbers", () => {
    const result = safeDivide(-10, 2);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(-5);
    }
  });
});

describe("calculatePercentage", () => {
  it("should calculate percentage correctly", () => {
    const result = calculatePercentage(25, 100);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("25.00%");
    }
  });

  it("should propagate division by zero error", () => {
    const result = calculatePercentage(25, 0);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Division by zero");
    }
  });

  it("should handle decimal percentages", () => {
    const result = calculatePercentage(1, 3);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("33.33%");
    }
  });
});

describe("fetchUserData", () => {
  it("should fetch user data successfully", async () => {
    const result = await fetchUserData("123");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        id: "123",
        name: "John Doe",
        email: "john@example.com",
      });
    }
  });

  it("should return error for invalid user ID", async () => {
    const result = await fetchUserData("invalid");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("INVALID_ID");
      expect(result.error.message).toBe("Invalid user ID format");
    }
  });
});
