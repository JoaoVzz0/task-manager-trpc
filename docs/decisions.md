# Decisions and trade-offs

[Back to README](../README.md)

## Data and API

- **In-memory store on `globalThis`.** Next.js can load the same module in more than one module graph (the route handler and the server components) and re-evaluates it on hot reload; `globalThis` keeps one store for all of them. The cost: data resets on restart and is not shared across instances or serverless functions. The `TaskRepository` interface is the seam for a real database.
- **Cursor (keyset) pagination.** Creating or deleting tasks between page loads never duplicates or skips one, and the cursor maps directly to an indexed SQL query. The in-memory implementation sorts on every call, which is fine at this size.
- **Server-side data without HTTP.** Server components call the procedures in-process through the tRPC options proxy, with the same validation and middleware. `createCaller` appears only in tests, so there is a single way to do server-side fetching.
- **Shared validation, untrusted client.** The form and the API use the same Zod schema; the server validates everything again. Local errors block the request, server field errors land on their field, and other failures show above the form.
- **Update is a full replacement.** The form always sends every field, so an omitted description clears the stored one. No partial patch semantics to get wrong.

## User experience

- **No optimistic updates.** Mutations show an explicit pending state and refresh from the server afterwards; the delete dialog stays open until the request settles so a failure can be retried.
- **Double submissions are blocked synchronously.** The tRPC batch link packs calls made in the same tick into one request, so a fast double click used to save a task twice. A ref guard now ignores the second click before React re-renders.
- **Dates in UTC.** Cards render on the server and hydrate in the browser; a fixed time zone avoids hydration mismatches, at the cost of not showing the viewer's local time.
- **Not-found pages answer HTTP 200.** The edit route streams its loading skeleton, so the status is already sent when the page calls `notFound()`. Next.js then adds `noindex` to the page. The API keeps returning a semantic 404.
- **Light theme only**, so toasts are pinned to light instead of following the OS.

## Security

- **Security basics.** Every input is validated with size limits; user text is rendered as text, never as HTML (`dangerouslySetInnerHTML` is a lint error); responses set `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options` and omit `X-Powered-By`; there are no secrets or environment variables. The `/` → `/tasks` redirect comes from the Next.js config, which applies redirects before headers, so that bodyless 307 does not carry them.

## Platform

- **Next.js 15**, as the challenge requires, rather than 16.
- **Docker uses Next's standalone output**, enabled only during the image build (`NEXT_OUTPUT=standalone`). It cuts the image from 1.27 GB to 343 MB; local builds keep the default output that `next start` and the E2E suite rely on.

## Out of scope

Authentication, rate limiting, persistence, optimistic concurrency (`updatedAt` could serve as a version), a completion status, internationalization and a Content Security Policy.
