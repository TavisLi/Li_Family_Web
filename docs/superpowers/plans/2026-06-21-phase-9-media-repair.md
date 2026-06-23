# Phase 9 Media Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓既有 Payload 媒體紀錄可在明確指定時重新上傳原始檔，修復 R2 缺失物件而不改變預設 seed 的安全行為。

**Architecture:** 在 seed CLI 新增 `--refresh-media-source` 參數；它接受一個既有 `sourcePath`，只重新上傳該媒體資料列的實體檔案，並保留原本的 Payload ID 與所有關聯。預設的 `seed:phase-9` 不會觸發重傳，避免不必要地改動數百個 R2 物件。

**Tech Stack:** TypeScript、Payload Local API、Cloudflare R2 S3 adapter、Node test runner、tsx。

---

### Task 1: 定義受控重傳參數並建立失敗測試

**Files:**
- Create: `src/scripts/seed-media-repair.test.ts`
- Modify: `src/scripts/seed-media-repair.ts`
- Modify: `package.json`

- [ ] **Step 1: 寫入會失敗的測試**

```ts
import assert from 'node:assert/strict'

import { mediaSourcePathFromArgs } from './seed-media-repair'

assert.equal(
  mediaSourcePathFromArgs(['--refresh-media-source', 'content-source/assets/members/tavis/tavis-hero.jpeg']),
  'content-source/assets/members/tavis/tavis-hero.jpeg',
)
assert.equal(mediaSourcePathFromArgs([]), undefined)
assert.throws(() => mediaSourcePathFromArgs(['--refresh-media-source']), /requires a source path/)
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `pnpm exec tsx src/scripts/seed-media-repair.test.ts`

Expected: FAIL，因為 `seed-media-repair.ts` 尚不存在。

- [ ] **Step 3: 寫入最小實作**

```ts
export function mediaSourcePathFromArgs(args: string[]): string | undefined {
  const index = args.indexOf('--refresh-media-source')
  if (index === -1) return undefined
  const sourcePath = args[index + 1]
  if (!sourcePath || sourcePath.startsWith('--')) {
    throw new Error('--refresh-media-source requires a source path')
  }
  return sourcePath
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `pnpm exec tsx src/scripts/seed-media-repair.test.ts`

Expected: PASS。

### Task 2: 將單一原始媒體重新上傳到既有 Payload 紀錄

**Files:**
- Modify: `src/scripts/seed-media-repair.ts`
- Modify: `src/scripts/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: 在既有紀錄上使用 `filePath` 更新，而非建立新紀錄**

```ts
const stagedFilePath = await stageUploadFile(item.absolutePath)
await payload.update({
  collection: 'media',
  id: existingDoc.id,
  data,
  filePath: stagedFilePath,
})
```

只允許 `--refresh-media-source` 指定的一筆 `MediaSeed` 走這個分支；找不到來源或找不到既有資料列時，拋出明確錯誤並停止，不執行批量重傳。

- [ ] **Step 2: 加入明確 npm 指令**

```json
"seed:phase-9:refresh-media": "cross-env NODE_OPTIONS=--no-deprecation node --import tsx src/scripts/seed.ts --phase-9 --refresh-media-source"
```

- [ ] **Step 3: 執行全部 Phase 9 單元測試**

Run: `pnpm run test:phase-9`

Expected: PASS，包含新加入的參數測試。

### Task 3: Production 修復與讀回驗證

**Files:**
- Modify: `docs/phase-completion-reports/phase-09-content-alignment-v1-launch.md`

- [ ] **Step 1: 僅重傳缺失的 Tavis hero**

Run: `pnpm run seed:phase-9:refresh-media -- content-source/assets/members/tavis/tavis-hero.jpeg`

Expected: 同一筆媒體資料列重新上傳，沒有新建使用者或旅行資料。

- [ ] **Step 2: 讀回公開 R2 物件**

Run: `curl -sS -o /dev/null -w '%{http_code} %{content_type}\\n' https://pub-4fbd05079d3d44b6a5322892555bd849.r2.dev/tavis-hero-800x800.jpg`

Expected: `200 image/jpeg`。

- [ ] **Step 3: 重新執行全量資料、型別、建置與 Production 瀏覽驗證**

Run: `pnpm run test:phase-9 && pnpm tsc --noEmit && pnpm run build`

Expected: 全部 PASS；首頁圖片顯示正常，並重新檢查公開旅行頁與登入後家人頁。

- [ ] **Step 4: 更新交付報告並提交**

記錄修復根因、媒體 `200` 驗證、正式網址、合併與 Production 部署狀態。提交訊息：`fix: repair phase 9 missing hero media`。
