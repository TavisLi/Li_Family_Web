# Phase 08 完成交接報告：Production Hardening 與部署收尾

## Phase 範圍

Phase 8 將既有功能收斂為正式部署前的 production hardening，範圍包括：

- Cloudflare R2 / Payload S3 storage 設定審計與公開媒體 URL 管線。
- Media photo / YouTube video 邊界確認。
- SEO、canonical URL、Open Graph fallback 與 Blog JSON-LD 完整性。
- 圖片 fallback、client secret 邊界、動畫 client boundary 與資料層 pool 策略審計。
- Preview / Production 環境變數與部署操作文件。

本 Phase 未新增大型前台互動功能，也未變更 Payload collection schema。

## Branch / Commit

- Branch：`codex/phase-8-production-hardening`
- Phase 文件與 worktree ignore：`3f5dfd9`、`2985dfa`
- Metadata helper：`a8916a4`
- Canonical / Open Graph fallback：`330112e`
- R2 media delivery audit：`7ab2964`
- Deployment documentation：`d056448`
- 本報告會隨 finalization commit 一併提交。

## GitHub Sync / PR 狀態

- branch 已成功推送至 `origin/codex/phase-8-production-hardening`。
- Draft PR：`https://github.com/TavisLi/Li_Family_Web/pull/8`。
- GitHub branch 與 PR 建立已完成；Vercel Preview / Production 驗證狀態見本報告後續章節。

## 已交付項目

### R2 / Media

- 保留既有 `@payloadcms/storage-s3` Cloudflare R2 設定：R2 env 完整時才啟用、`region: 'auto'`、`forcePathStyle: true`。
- 新增 `r2PublicFileUrl`，集中組合 public R2/CDN URL、storage prefix 與 filename。
- 當 `NEXT_PUBLIC_R2_PUBLIC_URL` 有設定時，Media S3 adapter 使用 `generateFileURL` 與 `disablePayloadAccessControl: true`，讓公開媒體 URL 直連 R2/CDN，而非使用 S3 API endpoint。
- 未設定 public R2 URL 時保留既有 fallback adapter 行為，避免本機開發因 R2 env 不完整而被阻塞。
- Media collection 維持 `photo | video`、`filesRequiredOnCreate: false`、`image/*`、400/800/1600 image sizes 與 YouTube URL validation；沒有 schema change，因此沒有 migration。

### SEO / Metadata

- 新增 `src/lib/site-metadata.ts`，集中 canonical base URL、absolute URL 與 OG fallback URL。
- App layout 設定 `metadataBase`、網站預設 OG image 與 robots。
- `/`、`/member/[slug]`、`/travel`、`/travel/[slug]`、`/blog`、`/blog/[slug]`、`/timeline`、`/bucket-list`、`/wrapped` 都有 canonical 與非空 Open Graph image fallback。
- 新增 Next `opengraph-image` metadata route，輸出 PNG fallback，不依賴空的 Payload media URL。
- Blog JSON-LD 改用 absolute canonical URL 與 fallback image；private Blog/Travel 的泛用 metadata guard 保持不變。

### 效能 / 安全審計

- 所有前台圖片使用點已確認使用 `PayloadImage` 或 `ImageFallback`；`PayloadImage` 維持 relation ID、空 URL、載入失敗的統一 fallback 與明確 `sizes`。
- `WrappedStory` 已透過 `next/dynamic` 做 client-side lazy loading；Canvas fireworks 維持在局部 client component。
- `use client` 模組掃描未發現 `PAYLOAD_SECRET`、`DATABASE_URI`、R2 secret、`@payload-config` 或 Payload config import。
- 保留 Phase 7 的首頁資料順序讀取，未將 Supabase pool sensitive flow 改為大範圍 `Promise.all`。

### 文件

- `.env.example` 改用 `NEXT_PUBLIC_SERVER_URL`，並說明 R2 public domain 用途。
- README 說明 Vercel、Supabase、Cloudflare R2 的責任邊界、Preview / Production URL 規則與 rollback。
- 新增 `docs/production-deployment-checklist.md`，涵蓋 env、R2、Preview/Production smoke test 與回復流程。

## Key Files

- `src/payload/payload.config.ts`
- `src/payload/r2.ts`
- `src/payload/r2.test.ts`
- `src/lib/site-metadata.ts`
- `src/lib/site-metadata.test.ts`
- `src/app/(app)/opengraph-image.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/blog/[slug]/page.tsx`
- `docs/production-deployment-checklist.md`
- `.env.example`
- `README.md`

## Validation Commands

以下在 Node `20.20.2` 的 isolated worktree 執行：

- `pnpm exec payload generate:types`：通過。
- `pnpm run test:seed-content`：通過。
- `node --import tsx src/lib/site-metadata.test.ts`：通過，4 tests / 0 failures。
- `node --import tsx src/payload/r2.test.ts`：通過，3 tests / 0 failures。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過，Next.js 15.4.11 production build 完成。worktree 環境顯示多 lockfile 警告，因 Next 偵測到原專案與 worktree 各自的 `pnpm-lock.yaml`；不影響 build 結果。
- `pnpm run seed`：未通過，實際錯誤為本機缺少 `PAYLOAD_SECRET`，Payload 無法初始化；未以假值或成功結果替代。

## Browser QA 範圍

未能完成 in-app browser smoke test。直接以 Next dev server 綁定 `127.0.0.1:3000` 時，sandbox 回報：

```text
listen EPERM: operation not permitted 127.0.0.1:3000
```

local server 提權請求未完成，因此無法在本機執行 `/`、`/travel`、`/blog`、`/timeline`、`/bucket-list`、`/wrapped` 與 `/opengraph-image` 的 browser QA。完成 localhost permission 後，需依 `docs/production-deployment-checklist.md` 重跑公開與 family mode smoke test。

## Vercel Preview / Production 狀態

- Vercel Preview：成功。PR #8 的 `Vercel` status check 為 `SUCCESS`，deployment URL：`https://vercel.com/tavis-li-s-projects/li-family-web/8CX4oB6yJrSkE62yh6wPQAXm3PE3`。
- 本機未安裝 Vercel CLI，且沒有 `.vercel/project.json` project link；Preview 狀態透過 GitHub PR check 驗證。
- Production：待 PR merge 後確認。合併後需確認 Production 使用正式 `NEXT_PUBLIC_SERVER_URL`，並記錄 deployment URL 與 smoke test 結果。

## 已知限制

- `pnpm run seed` 需要本機或 CI 注入有效的 `PAYLOAD_SECRET`、`DATABASE_URI` 與必要 R2 env。
- 本機 sandbox 阻止 localhost port binding，因此 browser QA 尚待有權限環境執行。
- Production deployment 與其 post-merge smoke test 尚待 PR merge 後完成。

## 下一階段準備度

程式、型別、seed-content、metadata/R2 regression tests 與 production build 均有本機驗證證據。完成 GitHub 認證、Preview browser QA、PR merge 與 Production smoke test 後，可作為正式發布候選版本。
