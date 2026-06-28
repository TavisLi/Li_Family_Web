# Phase 12 v1.2 Member Profile Repair Completion Report

## Phase Scope

本階段對應 GitHub Issue #13、#14、#19、#20、#21，聚焦 Tavis 與 Lynn 的公開會員頁修復，以及 QA 後續要求：

- 共用會員頁打字機基礎，支援輸入、停頓、刪除、循環與 reduced-motion 可讀狀態。
- Tavis / Lynn 肖像焦點、信念覆蓋層、頁尾公開聯絡入口與同層級字級一致性。
- Tavis / Lynn 已發布內容在會員頁的呈現防護，避免空字串、舊 localized 形狀或缺圖造成破版。
- source-to-seed 路徑補齊 Lynn 的 `基本資料`、`經歷`、`專業` 章節解析，以及教育表格表頭過濾。
- QA 後新增 Users 可配置 footer contact 與每段職涯 milestone media，可選 0 張、1 張或多張照片。

## Branch / Commit

- Main merge commit: `4fb57c2` from PR #34 plus pending PR #35 head `49939af` before final merge.
- Primary implementation branch: `codex/phase-12-v1-2-member-profiles`
- QA fix branch: `codex/phase-12-member-profile-qa-fixes`
- Config/schema QA branch: `codex/phase-12-member-profile-config-qa`

## GitHub Sync / PR Status

- PR #33: https://github.com/TavisLi/Li_Family_Web/pull/33, merged into `main`.
- PR #34: https://github.com/TavisLi/Li_Family_Web/pull/34, merged into `main`.
- PR #35: https://github.com/TavisLi/Li_Family_Web/pull/35, open and Vercel checks passed at this report update; this report is included in the final PR update before merge.

## Delivered Features

- 新增 `MemberTypewriter` client component 與純狀態機，替代原本字軌動畫，保留 reduced-motion 靜態可讀輸出。
- Tavis 眉標改為 `DIGITAL TRANSFORMATION TECHNOLOGY LEADERSHIP`，typewriter 當前詞色調整為 `#1e3494`。
- 肖像圖片使用 Tavis / Lynn 專屬 object-position class，信念覆蓋層改為深色高對比毛玻璃並置中，quote 字級提升到 18px。
- 會員頁 section H2 統一同層級字級，timeline 日期與地點統一為 18px。
- 技能與 highlight 內容支援 `**文字**` 粗體渲染；highlight 內容中以 `-` 開頭的行會渲染為項目符號。
- 職涯照片支援每段 `careerTimeline[].milestoneMedia` 獨立選擇 0 張、1 張或多張照片；既有 Tavis `resumeMilestoneImages` 保留相容 fallback。
- 新增 Users `publicContact` group，公開頁尾 title、description、email、phone 可由 Payload Admin 設定。
- 新增 Payload migration `20260628_130305_member_profile_config` 與 generated types。
- 修正 source-to-seed parser，讓 Lynn 履歷來源能解析 bio、職涯、專業技能與教育資料，並保留新 Users 欄位結構相容。

## Key Files

- `src/features/member/member-profile-page.tsx`
- `src/features/member/member-typewriter.tsx`
- `src/features/member/typewriter.ts`
- `src/features/member/member-profile-page.test.tsx`
- `src/features/member/typewriter.test.ts`
- `src/payload/collections/Users.ts`
- `src/payload/payload-types.ts`
- `src/migrations/20260628_130305_member_profile_config.ts`
- `src/migrations/20260628_130305_member_profile_config.json`
- `src/scripts/seed-content.ts`
- `src/scripts/seed-content.test.ts`
- `src/components/ui/payload-image.tsx`

## Validation Commands

- `node --import tsx src/features/member/typewriter.test.ts`
- `node --import tsx src/features/member/member-profile-page.test.tsx`
- `pnpm run test:seed-content`
- `pnpm tsc --noEmit`
- `pnpm run test:phase-9`
- `git diff --check`
- `pnpm run build`
- `PATH=/Users/tien-hsinglee/.nvm/versions/node/v20.20.2/bin:$PATH pnpm exec payload migrate:create member-profile-config --skip-empty --force-accept-warning`

All validation commands passed. Migration creation required Node 20 because the Payload CLI fails on the current Node 26 runtime with the known `node:crypto?tsx-namespace` issue.

## Browser QA Scope

- Local dev server started at `http://localhost:3000`.
- `/member/tavis` returned HTTP 200 during QA.
- `/member/lynn` returned HTTP 200 during QA.
- In-app browser QA comments were addressed for heading hierarchy, quote glass treatment, typewriter color, timeline metadata sizing, per-career media selection, configurable footer, and dash-list rendering.

## Known Limitations

- Production data still needs the migration applied before the new Users fields can be edited in production Payload Admin.
- Existing production member records will not automatically have per-career `milestoneMedia` selected; editors must configure these in Users -> career timeline entries, or rely on the legacy Tavis filename fallback until records are updated.
- Local working tree still contains user-managed media asset changes and local tool files that were intentionally not included in PR #35.
- Responsive visual QA was performed through the in-app browser and local dev server, but production visual confirmation should happen after PR #35 merge and Vercel deployment.

## Next-Phase Readiness

Phase 12 v1.2 is ready to close after PR #35 is merged and the Vercel deployment completes. The next content/admin pass can focus on uploading or selecting final Tavis milestone media in Payload Admin and cleaning up local media asset filenames once the desired source set is confirmed.
