# Guestbook

## Goal

Visitors may leave a short public message and like messages or replies. Only the authenticated owner may publish a one-level reply.

This feature is optional. It must not delay core portfolio completion.

## Production Rule

A public guestbook is production-ready only when it has:

- shared persistence,
- server-side validation,
- owner deletion,
- rate limiting,
- like deduplication,
- loading, success, empty, error, and unavailable states.

Supabase is the selected production provider. `localStorage` exists only in Vite development mode; production shows an unavailable state when Supabase is not configured.

Public message reads use the `anon` role through `get_guestbook_entries()` and do not create an Auth user. That function returns approved rows only when no user session exists; all write and owner functions remain restricted to `authenticated`. Owner verification failure degrades the page to read-only rather than hiding successfully loaded messages.

The embedded guestbook loads only when it approaches the viewport. Anonymous Auth users are created only after a visitor submits a write with a valid Turnstile token. Existing sessions do not need another token for later writes. Anonymous sessions skip the unnecessary owner RPC.

## Message Rules

- Name: required, 2–40 characters.
- Message: required, 1–280 characters.
- Rendered as text.
- New messages publish immediately after server validation succeeds.

## Reply Rules

- One level deep.
- Owner session required.
- Author name and owner role come from the server, never the form.
- Message: required, 1–220 characters.
- Parent message must exist.
- Owner replies publish immediately under their parent message.

## Like Rules

- Apply to messages and replies.
- Visitor may like or unlike.
- Server deduplicates by anonymous visitor identity.
- Server applies a short cooldown to repeated toggles.
- Counts come from the server.
- Owner likes also set a server-controlled `liked by caur` marker.
- The client reloads server state after a successful toggle.

## UI States

### Loading

- Show compact skeletons or status text.
- Keep the rest of Home usable.

### Empty

- Invite the first message.
- Do not seed fake public messages.

### Unavailable

- Explain that the guestbook is temporarily unavailable.
- Do not show a form that cannot submit.

### Submission Success

- Confirm that the message was published.
- Clear the form only after success.

### Submission Error

- Preserve the user's input.
- Show a retryable message.
- Do not expose internal error details.

## Form

The primary message composer is collapsed by default. A `leave a message` disclosure button must:

- expose the name and message fields only after activation,
- report its state with `aria-expanded`,
- reference the composer with `aria-controls`,
- remain keyboard operable,
- leave the message list available while the composer is closed.

Every field needs:

- visible label,
- required state,
- character limit,
- inline validation,
- disabled/loading submit state.

Use `aria-live` for submission feedback.

## Layout

- Guestbook belongs near the bottom of Home.
- Messages are compact rows, not oversized cards.
- Replies indent one level.
- Name and date use metadata styling.
- Message text uses readable body contrast.
- Like count aligns consistently.
- Reply form appears only for the selected message.

## Owner Replies

Owner identity is verified by Supabase Auth and the `is_guestbook_owner()` database function. The private `/owner/login` route sends a magic link only to a pre-existing owner account. The guestbook exposes reply, delete, and logout controls inline after verification; no admin dashboard is required.

The owner email currently lives in the migration as a deliberate single-owner rule. Changing it requires a new migration, not a browser environment variable.

## Supabase Setup

1. Create a Supabase project and apply every file in `supabase/migrations/` in filename order, including `202611130001_guestbook_public_read.sql`.
2. Enable anonymous sign-ins and create a Cloudflare Turnstile widget for `caursty.dev` and `www.caursty.dev`.
3. Put the Turnstile **secret key** only in Supabase Dashboard → Authentication → Bot and Abuse Protection → CAPTCHA. Enable CAPTCHA protection.
4. Put the Turnstile **site key** in `VITE_TURNSTILE_SITE_KEY` and configure `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.example`.
5. Create the owner Auth user for `catursetyo26@gmail.com` before requesting a magic link.
6. Add the deployed `/owner/login` URL to the allowed Auth redirect URLs.
7. Apply the SQL migration before deploying the frontend that uses anonymous public reads.

The Supabase publishable key and Turnstile site key are browser-safe. Never expose a Turnstile secret, Supabase secret key, or service-role key in a `VITE_*` variable. Tokens expire and are reset after auth attempts.

## Cloudflare Traffic Protection

Create a WAF custom rule in Cloudflare Dashboard → Security → Security rules → Create rule → Custom rules:

- Name: `Block non-search crawlers for caursty`.
- Action: `Block`.
- Expression:

```text
(http.host in {"caursty.dev" "www.caursty.dev"} and cf.client.bot and not(cf.verified_bot_category in {"Search Engine Crawler" "Page Preview"}))
```

This uses Cloudflare's verified-bot fields to allow search indexing and social previews while blocking other verified crawler categories. It does not match every unverified automated client. Enable the provider-managed automated-traffic or Bot Fight Mode protection under Security → Settings → Bot traffic when available, and review Security Events before adding stricter rules. Do not add a blanket `not cf.client.bot` block: normal human visitors are not verified bots.

## Safety

- No HTML input.
- No `dangerouslySetInnerHTML`.
- Validate on server and client.
- Limit request size.
- Rate-limit writes.
- Store only the random Supabase Auth user ID needed for rate limiting and like deduplication; do not store visitor IP addresses.
- Let the owner delete abusive or unwanted content after publication.

## Acceptance Criteria

- Shared messages appear across browsers.
- Refresh does not lose state.
- Invalid input cannot be submitted.
- Loading, empty, success, error, and unavailable states work.
- Valid messages appear publicly after submission.
- Likes deduplicate.
- Only the verified owner can reply or delete.
- Owner likes and replies cannot be forged by submitting the name `caur`.
- Replies remain one level deep.
- The message composer opens and closes from the CTA without losing typed input.
- Keyboard and mobile use are comfortable.
- Guestbook failure does not break Home.
- Public reads do not call anonymous signup, including on a fresh browser profile.
- Owner-verification failure leaves successfully loaded public messages visible in read-only mode.
- Anonymous signup and owner magic-link requests require Turnstile tokens, while existing sessions can continue writing.
