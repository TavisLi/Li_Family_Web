# Phase 21 Overview Markdown 修復

- 日期：2026-09-02
- Branch／PR：`codex/phase-21-travel-memory-vnext`／#103（Draft）
- Scope：唯讀程式診斷、renderer 最小修復、focused regression、GET-only Preview QA。
- 不包含：Production content／media／schema／environment mutation、seed、cleanup、merge。

## 根因與最小方案

`parseSourceSections` 保留 Markdown 在 `body`，空的結構章節使用 `__SECTION_BOUNDARY__`；Payload `storySections.body` 是 textarea。`getTravelMemoryReadContext` 選取這些欄位，`toTravelMemoryOverview` 原樣傳遞，並沒有遺失格式。

三套 overview 共用的 `MemoryOverviewArchive` 卻將 `story.body` 直接放入 `<p>`，reminder text 也直接放入 `<li>`；React 正確跳脫文字，但這些字串未經專案既有的 Markdown block renderer。舊版 source section UI 有 boundary guard，新 archive 沒有。

最小修正：

1. Overview story／reminder 重用既有 `SourceBody`，不新增套件或第二套 block parser。
2. `SourceBody` 既有 table／list／quote／heading 解析保留；inline bold／code 改以 React `<strong>`／`<code>` 輸出，不使用 raw HTML。
3. 渲染時忽略 standalone boundary line；overview 不建立 boundary-only／空正文卡片。資料庫內容保持原樣。
4. 對正文容器與 story card 加 `min-w-0`，使寬表格捲動限制在既有 `overflow-x-auto` wrapper。

## Feedback loop 與驗證

Node `20.20.2`：

```sh
node --import tsx src/features/travel/travel-memory-pages.test.tsx
```

修復前連續兩次 FAIL：預期 `<strong>重要內容</strong>`，實際為 `<p>這是 **重要內容**…</p>`，同時包含未解析的 table／list／quote 與 boundary marker。修復後 PASS。

回歸測試覆蓋三套 style、nullable role、空正文、boundary-only 卡片、reminder heading、table/list/quote/bold/code、HTML 跳脫，以及三份正式本地來源的 parser → view model → renderer 路徑。來源測試不連線資料庫，不代替 true-data Browser QA。

- `pnpm run test:phase-21`：PASS。
- `pnpm run test:phase-19`（含 Travel Plan renderer）：PASS。
- `pnpm run build`：PASS。
- build 後 `pnpm tsc --noEmit`：PASS。
- `git diff --check`：PASS。
- 所有命令使用 Node `20.20.2`，`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。

## Preview QA

待修復 commit 的 Vercel Preview READY 後，使用已批准的 Chrome session 與 exact PR #103 Preview alias 進行 GET-only re-QA。不得將舊 deployment 的結果列作修復後證據。

## 預防與 rollback

舊 renderer regression 只有純文字 story fixture，會證明「內容有出現」卻抓不到「格式未解析」。新測試直接驗證語意 HTML 與占位符不外洩，並保留本地正式來源覆蓋。

Rollback 為獨立 revert 本次 renderer commit；不需要資料或 schema rollback。不藉此回填 role／transport，不修改已發布正文。
