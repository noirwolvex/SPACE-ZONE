# Space Zone Media

Space Zone Media is a Next.js 16 application for a corporate media site and digital marketplace. The platform combines editable services, startup tools, websites, portfolio work, educational books, customer accounts, admin management, AI chat, and Tap Payments.

## Stack

- Next.js 16 / React 19 / TypeScript
- Supabase Auth and Storage
- PostgreSQL through Prisma 7
- Tap Payments
- Gemini AI through a server-side API route
- OpenNext for Cloudflare Workers
- Tailwind CSS

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
```

Production build:

```bash
npm run build
```

## Environment

The application expects these server/runtime values where applicable:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional)
- `TAP_SECRET_KEY`
- `TAP_WEBHOOK_SECRET` (optional legacy/shared webhook secret)
- `PRISMA_POOL_MAX` (optional)

Never commit `.env*`, service-role keys, payment secrets, or generated credentials.

## Data and security

Paid books are protected server-side and are released only after a verified payment webhook. Supabase-hosted protected files use short-lived signed URLs; local fallback files are streamed only through an authorized route.

Admin authorization is based on the authenticated Supabase user linked to `Customer.role = ADMIN`. Legacy database admin credentials are no longer used.

The application uses PostgreSQL-backed rate limiting for AI chat, contact submissions, and traffic ingestion so limits are shared across worker instances.

## Database migrations

Prisma migrations live under `prisma/migrations/`. Apply pending production migrations with:

```bash
npx prisma migrate deploy
```

The migration history includes the security hardening, decimal money fields, distributed rate-limit storage, and foreign-key indexes.

## Cloudflare deployment

The project uses OpenNext with `wrangler.jsonc` for Cloudflare deployment:

```bash
npm run preview
npm run deploy
```

The GitHub Actions workflow in `.github/workflows/ci.yml` runs linting, type checking, security regression tests, and the production build. Configure repository secrets for `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before relying on the build job.
