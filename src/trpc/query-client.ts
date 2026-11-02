import { QueryClient } from "@tanstack/react-query";
import { isTRPCClientError } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers/app.router";

const MAX_RETRIES = 2;

/**
 * Creates a QueryClient with the app defaults: one per request on the server,
 * one per tab in the browser.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Above zero so data hydrated from the server is not refetched the
        // moment the client mounts.
        staleTime: 30_000,
        // Retry only transient failures: no response (network) or a 5xx.
        // A 4xx would fail the same way again, and errors raised in-process
        // during SSR are not HTTP errors, so they are never retried.
        retry(failureCount, error) {
          if (!isTRPCClientError<AppRouter>(error)) return false;
          const status = error.data?.httpStatus;
          if (status !== undefined && status < 500) return false;
          return failureCount < MAX_RETRIES;
        },
      },
      mutations: { retry: false },
      // Dates (createdAt, the pagination cursor) must survive the trip from
      // the server render to the browser cache, same as over the wire.
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });
}
