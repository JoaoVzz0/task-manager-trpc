import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/app.router";
import { createContext } from "@/server/trpc";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    // Client mistakes (4xx) are expected traffic; only log server faults.
    onError({ path, error }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`tRPC failed on ${path ?? "<no-path>"}:`, error);
      }
    },
  });
}

export { handler as GET, handler as POST };
