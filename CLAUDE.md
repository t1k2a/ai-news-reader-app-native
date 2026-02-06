# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI news aggregator application that fetches RSS feeds from various AI sources, translates content to Japanese, and automatically posts to X (Twitter). The project uses a hybrid architecture with both traditional Express server and serverless Vercel Functions.

## Architecture

**Dual Deployment Model:**
- **Development/Traditional:** Express server (`server/`) with in-memory/Redis caching
- **Production/Serverless:** Vercel Functions (`api/`) with Upstash Redis
- **Shared Business Logic:** Common utilities in `lib/` directory

**Key Components:**
- `lib/rss-feed.ts`: Fetches and processes 18+ AI RSS feeds (VentureBeat, OpenAI, Google AI, etc.)
- `lib/cache.ts`: Abstraction layer supporting both Upstash Redis and in-memory fallback
- `lib/translation-api.ts`: Japanese translation and text summarization
- `scripts/auto-post/`: X (Twitter) auto-posting scripts with posted ID tracking
- `client/`: React frontend with Vite

**Auto-Posting System:**
- **Primary mode**: RSS-based auto-posting via Vercel Cron (`api/cron/auto-post.ts`) - runs hourly
- **Legacy mode**: Manual queue-based (`posts_queue.json` with `status: pending`) via npm scripts
- **Shared logic**: Common posting utilities in `lib/auto-post.ts`
- Tracks posted article IDs to prevent duplicates (Redis or local JSON fallback)
- Configurable posting rate: max 10 posts per run, 10-second intervals (via env vars)
- GitHub Actions workflow also runs hourly (`auto-post.yml`)

## Development Commands

```bash
# Development server (8GB memory allocation)
npm run dev

# Development server (lighter, 4GB memory)
npm run dev:light

# Build for production (client + server bundles)
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database push (Drizzle ORM)
npm run db:push

# Manual X auto-post from posts_queue.json (posts status:pending items)
npm run auto-post

# RSS-based auto-post (fetches from feeds, checks posted IDs)
npm run auto-post:rss
```

## Important Technical Details

**ESM Configuration:**
- Project uses `"type": "module"` in package.json
- All local imports MUST use `.js` extensions (e.g., `from "./cache.js"`)
- Some dependencies (rss-parser) require CommonJS compatibility handling

**Serverless Considerations:**
- Vercel Functions have 10s timeout (configurable to 30s)
- `fetchAllFeeds()` can take 8s × 18 feeds - mitigated by:
  - 5-minute Redis caching
  - Concurrent limit of 5 feeds at a time
  - 3-second timeout per feed
  - Vercel Cron for background updates

**Caching Strategy:**
- Upstash Redis preferred (serverless-compatible)
- Automatic fallback to in-memory cache if Redis unavailable
- 5-minute TTL for news cache
- 30-day TTL for posted article IDs (max 1000 entries)

**Build Process:**
- Client: Vite builds to `dist/public`
- Server: esbuild bundles `server/index.ts` → `dist/index.js`
- API: Vercel auto-bundles functions, includes `lib/**` via vercel.json

## File Structure Conventions

```
api/                   # Vercel Functions (serverless endpoints)
├── index.ts          # Main API handler (all routes in one file)
├── cron/
│   └── auto-post.ts  # Hourly RSS auto-post cron
└── tsconfig.json     # ESM config for Vercel

lib/                   # Shared business logic (used by both server/ and api/)
├── rss-feed.ts       # RSS feed fetching & processing
├── auto-post.ts      # X (Twitter) posting logic (共通)
├── cache.ts          # Redis/memory cache abstraction
├── translation-api.ts
└── types.ts

server/                # Traditional Express server (development)
├── index.ts          # Server entrypoint with pre-warm
├── app.ts            # Express app creation
├── routes.ts         # API route handlers
└── vite.ts           # Vite dev server integration

scripts/auto-post/
├── index.ts          # Queue-based posting (posts_queue.json)
├── rss-auto-post.ts  # RSS-based posting with ID tracking
├── posts_queue.json  # Manual post queue (status: pending/published/failed)
└── posted_ids.json   # Local fallback for posted ID tracking

client/                # React frontend
└── src/
    ├── App.tsx
    ├── components/
    └── pages/
```

## Environment Variables

Required for auto-posting and external services:

```
# X (Twitter) API v2 Credentials
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=

# Auto-posting configuration (optional, has defaults)
AUTO_POST_MAX_PER_RUN=10          # Max posts per cron run (default: 10)
AUTO_POST_DELAY_SECONDS=10        # Delay between posts in seconds (default: 10)
APP_BASE_URL=https://glotnexus.jp # Base URL for article links in tweets (default: https://glotnexus.jp)

# Upstash Redis (for serverless caching)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron job authentication
CRON_SECRET=
```

## Auto-Posting Implementation Notes

**Primary Mode - Vercel Cron (`api/cron/auto-post.ts`):**
- Runs hourly via Vercel Cron Jobs (configured in `vercel.json`)
- Fetches latest articles from all RSS feeds via `fetchAllFeeds()`
- Uses shared logic from `lib/auto-post.ts`
- Checks posted IDs from Redis (or local fallback)
- Posts up to 10 new articles per run (configurable via `AUTO_POST_MAX_PER_RUN`)
- 10-second delay between posts (configurable via `AUTO_POST_DELAY_SECONDS`)
- 300-second timeout limit (5 minutes) - requires Vercel Pro plan
- CRON_SECRET authentication required

**Legacy Mode - Manual Scripts:**
1. **Queue-Based (`npm run auto-post`):**
   - Reads `scripts/auto-post/posts_queue.json`
   - Only posts items with `"status": "pending"`
   - Updates status to `"published"` or `"failed"` after attempt
   - Stores `tweet_id` and `published_at` on success

2. **RSS-Based (`npm run auto-post:rss`):**
   - Fetches latest articles from RSS feeds
   - Can be triggered via GitHub Actions hourly
   - Uses local `posted_ids.json` as fallback tracking

**Tweet Format:**
```
{title}

{APP_BASE_URL}/?article={article.id}

#{hashtags} #AI #GlotNexus
```
- 280 character limit
- URL counts as 23 chars (t.co shortening)
- URL points to app's article page (not original source)
- Title auto-truncated with "..." if needed

## Common Gotchas

1. **Import Extensions:** Always use `.js` extension in imports, even for `.ts` files
2. **RSS Feed Timeouts:** Individual feeds have 3s timeout; total operation cached for 5min
3. **Posted ID Tracking:** Uses Redis when available, falls back to local JSON file
4. **Vercel Function Bundling:** `lib/` must be explicitly included via vercel.json `includeFiles`
5. **Duplicate Posts:** Auto-post scripts check posted IDs to prevent duplicate tweets
6. **Rate Limits:** 10-second delay between posts (configurable); max 10 posts per cron run
7. **Cron Timeout:** Auto-post cron requires 300s timeout (Vercel Pro plan) for 10 posts × 10s delay
8. **Shared Logic:** `lib/auto-post.ts` contains all posting logic - used by both Cron and manual scripts
9. **Web API Independence:** `api/index.ts` only fetches articles; posting is separate (Cron responsibility)
