import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache, type ReactNode } from "react";
import { appRouter } from "@/server/routers/app.router";
import { createContext } from "@/server/trpc";
import { makeQueryClient } from "./query-client";

// One QueryClient per request, shared by everything rendered in it.
export const getQueryClient = cache(makeQueryClient);

// Passing the router (instead of an HTTP client) makes server components call
// the procedures in-process: no network round trip to our own API, yet the
// same input validation and middlewares still run.
export const trpc = createTRPCOptionsProxy({
  router: appRouter,
  ctx: createContext,
  queryClient: getQueryClient,
});

// Ships whatever the page prefetched to the browser cache.
export function HydrateClient({ children }: { children: ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}
