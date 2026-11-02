import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { TASKS_PAGE_SIZE } from "@/lib/task.schema";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = { title: "Tasks" };

/**
 * The list changes at runtime. Without this, `next build` would prerender the
 * page once and serve that frozen snapshot of the in-memory store forever.
 */
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  // Runs in-process on the server (see trpc/server.tsx) and fills the cache
  // that <TaskList /> reads, so the first page ships as HTML with no request.
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: TASKS_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrateClient>
      <div className="grid gap-6">
        <PageHeader
          title="Tasks"
          action={
            <Button asChild>
              <Link href="/tasks/new">New task</Link>
            </Button>
          }
        />
        <TaskList />
      </div>
    </HydrateClient>
  );
}
