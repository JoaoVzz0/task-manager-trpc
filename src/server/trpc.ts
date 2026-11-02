import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";
import { NotFoundError } from "./errors";
import { taskService } from "./tasks/task.service";

/**
 * Per-request context. Procedures reach the service through it, so tests can
 * inject one backed by a fresh store instead of the process-wide singleton.
 */
export function createContext() {
  return { taskService };
}
export type Context = ReturnType<typeof createContext>;

/**
 * Flattens validation issues into form-friendly field errors. The explicit
 * return type matters: flattening an untyped ZodError infers `fieldErrors: {}`,
 * which would make the field errors unreadable on the client.
 */
function flattenZodError(error: ZodError): {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
} {
  return z.flattenError(error);
}

const t = initTRPC.context<Context>().create({
  // Dates (createdAt, the pagination cursor) cross the wire as real Dates.
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError =
      error.cause instanceof ZodError ? flattenZodError(error.cause) : null;
    const isInternal = error.code === "INTERNAL_SERVER_ERROR";

    let message = shape.message;
    if (zodError) {
      // tRPC's default message is a raw dump of the Zod issues; send readable text.
      message =
        [
          ...zodError.formErrors,
          ...Object.values(zodError.fieldErrors).flat(),
        ].join("; ") || "Invalid input";
    } else if (isInternal && process.env.NODE_ENV === "production") {
      // Never leak internal error details to the client in production.
      message = "Something went wrong. Please try again.";
    }

    // zodError lets the form attach each server-side error to its own field.
    return { ...shape, message, data: { ...shape.data, zodError } };
  },
});

/**
 * The single place that maps domain errors to semantic tRPC codes, so domain
 * code stays transport-agnostic. Anything unmapped surfaces as
 * INTERNAL_SERVER_ERROR.
 */
const mapDomainErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && result.error.cause instanceof NotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: result.error.cause.message,
      cause: result.error.cause,
    });
  }
  return result;
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure.use(mapDomainErrors);
