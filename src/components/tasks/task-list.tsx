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
import { useOnInView } from "@/hooks/use-on-in-view";
import { TASKS_PAGE_SIZE } from "@/lib/task.schema";
import { getErrorMessage } from "@/lib/trpc-error";
import { useTRPC } from "@/trpc/client";

/**
 * Task list with infinite scroll, rendered from the cache the page prefetched.
 * The next page loads as the "Load more" button nears the viewport; the button
 * stays clickable for keyboard users and as a fallback.
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

  // By default fetchNextPage cancels and restarts a fetch already in flight.
  // The scroll trigger and a click can both fire before React re-renders, so
  // a repeated call must join the running fetch instead.
  const loadNextPage = () => fetchNextPage({ cancelRefetch: false });

  const loadMoreRef = useOnInView<HTMLButtonElement>(
    () => {
      // After a failure, only the user retries.
      if (hasNextPage && !isFetchNextPageError) void loadNextPage();
    },
    {
      // Starts loading a little before the button is reached.
      rootMargin: "200px",
      // Re-checks after each page renders, so a button still in view (a tall
      // screen) keeps loading until the screen is filled.
      resetKey: data.pages.length,
    },
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
              onClick={loadNextPage}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage && <Spinner />}
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : hasNextPage ? (
        <Button
          ref={loadMoreRef}
          variant="ghost"
          className="justify-self-center"
          onClick={loadNextPage}
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
