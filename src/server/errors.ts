import "server-only";

/**
 * Thrown when a resource does not exist. Domain errors know nothing about HTTP
 * or tRPC; the API layer maps them to transport codes in one place (trpc.ts).
 */
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} "${id}" not found`);
    this.name = "NotFoundError";
  }
}
