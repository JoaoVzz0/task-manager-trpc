const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/**
 * Formats a date for display, always in UTC. The zone is fixed on purpose:
 * cards render on the server and hydrate in the browser, and two different
 * zones would produce a hydration mismatch.
 */
export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}
