"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { AlertCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { EmptyState } from "@/components/tasks/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TASKS_PAGE_SIZE } from "@/lib/task.schema";
import { getErrorMessage } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

/**
 * Task list with cursor pagination, rendered from the cache the page
 * prefetched.
 */
export function TaskList() {
  const trpc = useTRPC();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useSuspenseInfiniteQuery(
    // Same input as the server prefetch in app/tasks/page.tsx. If they differ,
    // the query key differs and the hydrated first page is ignored.
    trpc.task.list.infiniteQueryOptions(
      { limit: TASKS_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  const tasks = data.pages.flatMap((page) => page.items);

  if (tasks.length === 0) return <EmptyState />;

  return (
    <section aria-label="Tasks" className="grid gap-4">
      <ul className="grid gap-4">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              actions={
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/tasks/${task.id}/edit`}
                      aria-label={`Edit "${task.title}"`}
                    >
                      <Pencil />
                    </Link>
                  </Button>
                  <DeleteTaskButton task={task} />
                </div>
              }
            />
          </li>
        ))}
      </ul>

      {/* A failure on a later page does not reach the error boundary (the
          first page is already on screen), so it is surfaced here. */}
      {isFetchNextPageError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not load more tasks</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(error)}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage && <Spinner />}
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : hasNextPage ? (
        <Button
          variant="ghost"
          className="justify-self-center"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? (
            <>
              <Spinner />
              Loading more…
            </>
          ) : (
            "Load more"
          )}
        </Button>
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          You&apos;ve reached the end
        </p>
      )}
    </section>
  );
}
