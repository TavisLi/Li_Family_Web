# Web Li - Codex Operational Guide & System Instructions

As an AI Agent working on the project, you are granted permission to autonomously read files, execute builds, and validate code. You **MUST** strictly adhere to the following operational guide and technical boundaries at all times.

## 🚨 CRITICAL VERSION WARNING (Training Data Override)
**This is NOT the Next.js or Payload CMS you might know from your base training data.** - We are strictly using **Next.js 15 (App Router ONLY)** and **Payload CMS v3 stable**.
- We are strictly using **Next.js 15 (App Router ONLY)** and **Payload CMS v3 stable**.
- **Version Compatibility Rule**: Use the Payload official compatibility matrix as the source of truth. For this project, prefer Next.js `15.4.x` with a Payload-supported patch level (minimum `15.4.11`) unless the team explicitly approves a newer compatible range.
- **Payload v3 has MASSIVE breaking changes**: It no longer uses a separate Express server; it runs natively inside the Next.js App Router.
- **Payload v3 Config Rule**: You must use the `withPayload` plugin in `next.config.mjs` to inject Payload into Next.js.
- **Admin Route Rule**: Payload v3 admin UI MUST be located strictly at `src/app/(payload)/admin/[[...segments]]/page.tsx`.
- Do NOT use old Next.js `pages/` directory conventions.
- Do NOT use Payload v2 conventions.
- If local project instructions conflict with current official Next.js or Payload documentation, stop and ask the user for confirmation instead of blindly executing the outdated instruction.
- If you are unsure about an API or configuration, use your search tools to read the latest Next.js 15 or Payload v3 official documentation before writing code. Heed deprecation notices.

## 1. Project Context & Blueprint Reference (强制上下文读取)
Before creating schemas, components, or writing any business logic, you MUST use FileSystem tools to read the following blueprint files. Do not guess or hallucinate data models:
- **Core Requirements (架构蓝图)**: `docs/全栈系统需求与技术架构说明书.md`
- **Metadata Configs (动态配置)**: `docs/family-members.md` and `docs/travel-projects.md`
- **Raw Seed Data (真实数据源)**: Scan `content-source/` (including `/profiles/` and `/travels/`) for real Markdown content to infer types and structures.

## 2. Environment & Terminal Commands (环境与执行命令)
Whenever you need to build, run, or generate types, use the following exact commands. You are encouraged to run these to self-correct TS errors:
- **Build Project**: `pnpm run build`
- **Development Server**: `pnpm dev`
- **Generate Payload Types**: `pnpm exec payload generate:types`
- **Database Migration**: `pnpm exec payload migrate:create`
- **Self-Correction Check**: `pnpm tsc --noEmit` (Run this before submitting code to ensure zero TypeScript errors).

## 3. Strict Architecture Bounds (绝对技术边界)
- **Framework & Path**: Strictly Next.js 15 App Router. All application code must reside under `src/app/`.
- **Data Fetching Layer**: ABSOLUTELY NO direct Payload Local API calls from frontend components. All data consumption must go through encapsulated logic in the `src/lib/data/` layer.
- **Error & Loading Boundaries (全域边界捕获)**: You MUST implement `error.tsx` and `loading.tsx` in key route segments (e.g., `src/app/(app)/`). Loading states must utilize Skeleton components that mirror the glassmorphism and shimmer effects of the `ImageFallback`.
- **Styling**: Globally use Tailwind CSS and the `shadcn/ui` component library. Inline styles (`style={{}}`) are strictly prohibited.
- **Security**: Never expose environment variables containing secrets in any `"use client"` components.

## 4. Schema-First Mandatory (数据模型与类型优先)
- **Single Source of Truth**: Payload CMS Collection is the ONLY source of truth for the database.
- **No Raw Schemas**: Never manually write or modify raw Prisma or Drizzle schemas.
- **Type Safety Pipeline**: After updating any Collection, you MUST run `pnpm exec payload generate:types`. All frontend components must import and use types strictly from `src/payload/payload-types.ts`. No `any` types allowed.

## 5. Fallback & Rendering Rules (容错与前端渲染规范)
- **Optional Media**: All image and media relational fields in Payload must be set to `required: false` to prevent data-entry blockers.
- **Graceful Degradation (ImageFallback)**: If an image URL is null or missing, you MUST force-render the `ImageFallback` component. This component must use glassmorphism styling (`backdrop-blur-md bg-white/10`), a shimmer gradient, and center-aligned placeholder text.
- **Storage Constraints**: Do NOT use Vercel Blob for storage configurations. The system is reserved for the Cloudflare R2 S3 adapter.
