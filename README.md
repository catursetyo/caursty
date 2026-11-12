# caursty

Catur Setyo Ragil's personal portfolio, built with Vite and React and deployed on Cloudflare Pages.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The guestbook requires these public Supabase and Turnstile values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_TURNSTILE_SITE_KEY
```

The Turnstile secret key belongs only in Supabase Auth's CAPTCHA settings. Never add it to a `VITE_*` variable. Apply all SQL migrations in filename order before deploying the frontend.

## Verification

```bash
npm run lint
npm run build
```

Cloudflare Pages builds `main` with `npm run build` and publishes `dist/`.
