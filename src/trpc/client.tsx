"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState, type ReactNode } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers/app.router";
import { makeQueryClient } from "./query-client";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  // On the server every render needs its own client, or data would leak
  // between requests.
  if (typeof window === "undefined") return makeQueryClient();
  // In the browser keep a single instance: if React suspends during the first
  // render it throws the component state away, and a client created inside
  // state would be lost along with the hydrated cache.
  return (browserQueryClient ??= makeQueryClient());
}

export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          // Relative on purpose: only the browser issues HTTP calls. During SSR
          // the page prefetches in-process and the client renders from that
          // cache, so a server-side fetch here would mean a cache key mismatch.
          url: "/api/trpc",
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
