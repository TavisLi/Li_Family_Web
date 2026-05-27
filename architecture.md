# Project Architecture & AI Coding Guidelines for "Web Li"

## 1. Tech Stack Overview

- **Core Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS (Mobile-first, Responsive)
- **Components:** shadcn/ui (Radix Primitives)
- **Animations:** Framer Motion (for Timeline and page transitions)
- **i18n (Localization):** `next-intl` (Default: zh-TW, Fallback: en)
- **CMS (Content Management):** Payload CMS (self-hosted, integrated with Next.js)
- **Database:** Vercel Postgres (via Payload's Postgres adapter)
- **Authentication:** Payload CMS built-in authentication (for Admin portal)
- **Media Storage:** Vercel Blob (for CMS photo/video uploads)
- **Deployment & CI/CD:** GitHub + Vercel (Auto-deploy on `main` branch push)

---

## 2. Directory Structure & Conventions

All AI agents must strictly follow this structure:

```
├── app/
│   ├── [locale]/                    # All localized frontend routes
│   │   ├── page.tsx                 # Homepage
│   │   ├── members/[slug]/          # Member pages
│   │   ├── timeline/                # Family timeline & travel details
│   │   └── layout.tsx               # Root layout with Navbar, Footer, locale switcher
│   ├── admin/                       # Payload CMS admin panel (no locale prefix)
│   │   ├── [[...segments]]/page.tsx # Payload admin route handler
│   │   └── layout.tsx               # Admin layout (minimal, no locale)
│   └── api/                         # Next.js API routes (if needed for custom endpoints)
├── components/
│   ├── ui/                          # Reserved for pristine shadcn components
│   ├── layout/                      # Global Navbar, Footer, Theme/Locale Switchers
│   ├── interactive/                 # Complex components (Timeline, MediaGallery, etc.)
│   └── home/                        # Homepage-specific components
├── collections/                     # Payload CMS collections (database models)
│   ├── TimelineEvent.ts
│   ├── TravelProject.ts
│   ├── Member.ts
│   ├── TravelMedia.ts
│   ├── GlobalMedia.ts
│   ├── ContactInfo.ts
│   └── Users.ts                     # Admin users (built-in by Payload, but can extend)
├── globals/                         # Payload globals (single-instance configs)
│   └── SiteConfig.ts
├── payload.config.ts                # Payload CMS configuration
├── lib/
│   ├── payloadClient.ts             # Payload client singleton
│   ├── utils.ts                     # cn(), formatDate, etc.
│   └── validations/                 # Zod schemas (frontend validation)
├── hooks/                           # Custom React hooks (useMediaUpload, etc.)
├── public/                          # Static assets
└── .env.local                       # Environment variables
```

> **Important Payload integration notes:**
> - Payload runs **inside Next.js** using the `@payloadcms/next` plugin. No separate server.
> - The admin panel is mounted at `/admin` (no `[locale]` prefix) – it is intentionally isolated from the multilingual frontend.
> - All database models are defined as **Payload Collections** (see `collections/` folder). No manual Prisma schema is required.
> - Payload handles authentication, file uploads (via Vercel Blob adapter), and REST/GraphQL APIs automatically.

---

## 3. Coding Standards (Strictly Enforced)

### Frontend (Next.js + React)

- **Server vs Client:** Default to Server Components. Use `"use client"` ONLY when hooks (`useState`, `useEffect`) or browser APIs are needed.
- **Styling Rules:** Purely Tailwind CSS. No vanilla CSS or inline styles. Use `cn()` utility for class merging.
- **Image Optimization:** Always use Next.js `<Image />`. Remote patterns must include Vercel Blob domain (`*.blob.vercel-storage.com`).
- **Database Access:** Frontend code MUST NOT directly call Payload's local API. Use Server Actions or fetch Payload's REST API endpoints.
- **Component Pattern:** Functional Components with TypeScript. Prefer `export default function Name()`.
- **Responsiveness:** All layouts must be mobile-friendly (`sm:`, `md:`, `lg:` breakpoints).

### Payload CMS (Backend)

- **Collection Definition:** Every data model must be defined as a Payload Collection in `/collections` with proper TypeScript types.
- **Access Control:** Define `access` properties to protect data (admin only for mutations; public read for most frontend data).
- **Hooks:** Use Payload hooks (`beforeChange`, `afterChange`) for data validation, media processing, or syncing.
- **Uploads:** For media collections, use `upload: true` with `adapter: vercelBlobAdapter()` configured in `payload.config.ts`.
- **Localization:** Collections that require multilingual fields should enable `localized: true` on specific fields (e.g., `title`, `description`).
- **Custom Endpoints:** If needed, add custom endpoints via `endpoints` property in collections.

---

## 4. Git & Workflow Rules

- Every feature or bug fix must be developed in a scoped feature branch (e.g., `feature/admin-auth`).
- Commit messages must follow Conventional Commits (e.g., `feat: add member profile cards`).
- Do not push directly to `main`. Rely on Pull Requests to trigger Vercel preview deployment checks.

---

## 5. Environment Variables (required in `.env.local` / Vercel)

```bash
# ==================== Payload CMS ====================
PAYLOAD_SECRET=                     # strong random string for session encryption
DATABASE_URI=                       # Vercel Postgres connection string (same as POSTGRES_URL)
PAYLOAD_PUBLIC_SERVER_URL=          # Vercel deployment URL / http://localhost:3000

# ==================== Vercel Blob ====================
BLOB_READ_WRITE_TOKEN=              # Vercel Blob storage token (required for uploads)

# ==================== Optional: Admin user seed ====================
PAYLOAD_SEED_ADMIN_EMAIL=
PAYLOAD_SEED_ADMIN_PASSWORD=

# ==================== Optional: External services ====================
# (if you later add Cloudinary or other storage, add here)
```

> **Important:**
> - `PAYLOAD_SECRET` is mandatory – generate one via `openssl rand -base64 32`.
> - `DATABASE_URI` should point to your Vercel Postgres database (use pooled connection if needed).
> - Vercel Blob token must have read+write permissions.

---

## 6. Payload Collections Overview (Simplified)

Define these collections inside `/collections`:

| Collection | Purpose |
|---|---|
| `Users` | Admin accounts (built-in, extend to add roles) |
| `Member` | Family members (Tavis, Lynn, Yunsheng, Leo, Sophie) |
| `TimelineEvent` | Family events & travels (has `isTravel` boolean) |
| `TravelProject` | Travel details (itinerary JSON, tags, media relationship) |
| `TravelMedia` | Images/videos for travel projects (upload handled by Payload + Vercel Blob) |
| `GlobalMedia` | Reusable media (family photos, avatars) |
| `ContactInfo` | Key-value pairs for footer contact details (phone, email, address) |

See the implementation plan for detailed field definitions.

---

## 7. Development Workflow with Payload

1. **Start dev server:** `pnpm dev` (runs Next.js + Payload together)
2. **Modify a collection** → Payload automatically generates database migrations (run `pnpm payload migrate:create`)
3. **Apply migrations:** `pnpm payload migrate` (or `pnpm payload migrate:dev` during development)
4. **Access admin panel:** `http://localhost:3000/admin`
5. **Seed initial data:** Use the seed script or the admin UI.

---

## 8. Notes for AI Agents (Claude Code / Google Antigravity)

- Do **not** manually write Prisma schemas – Payload collections are the single source of truth for the database.
- When creating a new collection, also update the implementation plan or README accordingly.
- For frontend data fetching, prefer Server Components using Payload's REST API via `fetch` or use Payload's Local API inside Server Actions.
- **Never** expose `PAYLOAD_SECRET` or `BLOB_READ_WRITE_TOKEN` in client code.
- If you need to run database queries outside Payload (rare), use the `@payloadcms/db-postgres` adapter's raw query capabilities – but prefer Payload's APIs.
- File uploads: Always use Payload's upload collections – **never** write custom upload handlers.
