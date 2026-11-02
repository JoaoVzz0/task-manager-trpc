import { isTRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers/app.router";

/**
 * Server-side validation errors, first message per field, ready for the form.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isTRPCClientError<AppRouter>(error)) return {};

  const zodFieldErrors = error.data?.zodError?.fieldErrors;
  if (!zodFieldErrors) return {};

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(zodFieldErrors)) {
    const first = messages?.[0];
    if (first) fieldErrors[field] = first;
  }
  return fieldErrors;
}

/**
 * True when the server answered NOT_FOUND, e.g. the task was deleted in another
 * tab.
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    isTRPCClientError<AppRouter>(error) && error.data?.code === "NOT_FOUND"
  );
}

/**
 * A message that is safe to show the user for any error thrown by a tRPC call.
 */
export function getErrorMessage(error: unknown): string {
  if (isTRPCClientError<AppRouter>(error)) {
    // No data means no HTTP response from the API (offline, server down).
    return error.data
      ? error.message
      : "Could not reach the server. Check your connection and try again.";
  }
  // Unknown errors may carry technical text, so they are never shown as is.
  return "Something went wrong. Please try again.";
}
