import type { Task } from "@/lib/task.schema";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Ordered newest first. 25 entries so the page size of 10 yields three pages,
 * which makes cursor pagination visible in a demo.
 */
const SEED_TASKS: ReadonlyArray<
  readonly [title: string, description?: string]
> = [
  [
    "Review pull request for onboarding flow",
    "Focus on the empty states and error copy.",
  ],
  [
    "Fix flaky checkout test",
    "Fails roughly one run in ten on CI; likely a race on the cart total.",
  ],
  ["Write release notes for v1.4"],
  [
    "Rotate staging API credentials",
    "Update the secret store, then redeploy staging.",
  ],
  ["Plan Q1 roadmap workshop", "Book a room, invite design and support leads."],
  ["Reply to customer about invoice discrepancy"],
  [
    "Upgrade dependencies",
    "Patch and minor versions only; major bumps go in a separate PR.",
  ],
  [
    "Add rate limiting to public endpoints",
    "Start with the login and password reset routes.",
  ],
  ["Draft accessibility audit checklist"],
  [
    "Migrate image uploads to object storage",
    "Keep the old URLs working through a redirect.",
  ],
  ["Refactor notification preferences screen"],
  ["Set up uptime alerts", "Page on-call after two consecutive failed checks."],
  [
    "Interview frontend candidate",
    "Panel at 14:00, prepare the pairing exercise.",
  ],
  [
    "Clean up unused feature flags",
    "Three flags have been at 100% for over a month.",
  ],
  ["Document the deployment process"],
  [
    "Investigate slow dashboard query",
    "p95 is above two seconds; check missing indexes first.",
  ],
  [
    "Update privacy policy wording",
    "Waiting on legal sign-off before publishing.",
  ],
  ["Prepare sprint demo", "Show the new filters and the bulk actions."],
  ["Archive stale support tickets"],
  [
    "Evaluate error tracking vendors",
    "Compare pricing, source map support and data retention.",
  ],
  ["Add dark mode to the marketing site"],
  [
    "Back up the production database",
    "Verify the restore procedure, not only the export.",
  ],
  [
    "Organize team retrospective",
    "Collect topics in the shared board by Thursday.",
  ],
  ["Translate onboarding emails"],
  [
    "Create the project README",
    "Cover setup, scripts and the architecture overview.",
  ],
];

/** Builds the sample tasks, one hour apart, the first one created at `now`. */
export function createSeedTasks(now: Date = new Date()): Task[] {
  return SEED_TASKS.map(([title, description], index) => {
    const createdAt = new Date(now.getTime() - index * HOUR_MS);
    return {
      id: crypto.randomUUID(),
      title,
      description,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
