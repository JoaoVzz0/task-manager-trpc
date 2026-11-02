"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Error boundary for every /tasks route. Server errors reach the browser with
 * their details stripped, so the message here is deliberately generic.
 */
export default function TasksError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function retry() {
    // reset() alone re-renders with the same failed server payload; refresh
    // makes the server render the page again.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        <p>We could not load this page. Please try again.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={retry}
          disabled={isPending}
        >
          {isPending && <Spinner />}
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
