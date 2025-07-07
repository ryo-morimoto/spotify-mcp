import { Result, ok, err } from "neverthrow";

/**
 * Example of using Result type for safe division
 * Returns an error when dividing by zero instead of throwing
 */
export function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

/**
 * Example of chaining Result operations
 */
export function calculatePercentage(value: number, total: number): Result<string, string> {
  return safeDivide(value * 100, total).map((percentage) => `${percentage.toFixed(2)}%`);
}

/**
 * Example of async operation with Result
 */
export async function fetchUserData(userId: string): Promise<Result<UserData, FetchError>> {
  try {
    // Simulating API call
    if (userId === "invalid") {
      return err({ code: "INVALID_ID", message: "Invalid user ID format" });
    }

    // Simulating successful response
    const userData: UserData = {
      id: userId,
      name: "John Doe",
      email: "john@example.com",
    };

    return ok(userData);
  } catch (error) {
    return err({
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Example types
 */
interface UserData {
  id: string;
  name: string;
  email: string;
}

interface FetchError {
  code: string;
  message: string;
}
