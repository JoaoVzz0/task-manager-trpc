import "server-only";

// Domain errors know nothing about HTTP or tRPC. The API layer translates them
// into transport-level codes in one place (see trpc.ts).
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} "${id}" not found`);
    this.name = "NotFoundError";
  }
}
