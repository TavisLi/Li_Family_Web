# Phase 4-1 Completion Report — Travel Content Source Readiness

## 1. Phase 範圍

Phase 4-1 是 Phase 4 Travel Interaction System 完成後的延伸整理工作，目標不是新增前台互動功能，而是把後續 Phase 可重複使用的旅遊內容源、素材治理、manifest 對應與設計文檔規則整理成穩定基礎。

本次完成範圍：

- 建立旅遊內容交付指南，規範新增旅遊 Markdown、照片、影片與 seed 驗證流程。
- 建立 `content-source/assets/` 圖片與媒體命名規則。
- 將 travel media manifest 從單一全域 manifest 拆分為各 travel 資產資料夾的 local manifest。
- 擴充 seed parser，支援主 manifest + travel local manifest 合併，並保留 itinerary 精細 metadata。
- 以 `202602-thailand-phuket` 作為精細 itinerary mapping 樣板。
- 新增 `docs/design/` 設計文檔目錄，並導入 `202702-thailand-phuket` 專屬 DESIGN.md。
- 統一 `202607-chongqing-yangtze-river` 的資產資料夾與 travel owner slug。

## 2. Branch / Commit

- 當前分支：`codex/phase-7-time-capsule-bucket-wrapped`
- 當前 HEAD：`ef0bc84 Document phase 7 PR status`
- Phase 4-1 相關變更狀態：尚未 commit
- 說明：本批工作是在 Phase 7 分支上的後續整理變更，工作樹同時包含未追蹤素材與既有 dirty 狀態，因此尚未建立乾淨的 Phase 4-1 commit。

## 3. GitHub Sync / PR 狀態

- GitHub push：尚未執行
- Pull Request：尚未建立
- PR 阻塞原因：
  - 目前分支不是 Phase 4-1 專用分支。
  - 工作樹包含多項未追蹤內容，例如 `202602-thailand-phuket` 資產、`202702-thailand-phuket` 資產、Blogger takeout zip 與 `.DS_Store`。
  - 需要先確認哪些素材應納入本次提交，哪些應留給 Phase 5/後續 Phase 或排除。

Phase completion 規則提醒：本報告已輸出並完成技術驗證，但 Phase 4-1 的 GitHub 同步尚未完成；正式交付仍需後續建立 commit、push branch 並建立 PR，或明確記錄 PR blocker。

## 4. Delivered Features / Changes

### 4.1 Travel Content Source Guidelines

新增並更新旅遊內容交付規則：

- 新增旅行 Markdown 結構建議。
- 定義 cover / gallery / itinerary 照片資料夾。
- 定義 YouTube 影片只保存外部 URL，不儲存原生影片檔。
- 補充新增旅遊項目時的 seed 驗證流程。
- 補充 local manifest 與 travel design docs 規則。

### 4.2 Asset Guidelines

更新 `content-source/assets/` 治理規則：

- 明確 travel 專屬 manifest 應放在 `content-source/assets/travels/[travel-slug]/manifest.json`。
- 主 manifest `content-source/assets/manifest.json` 保留為全域、跨專案或例外映射用途。
- `sourcePath` 統一使用相對於 `content-source/assets/` 的路徑。
- local manifest 在同一張圖片上會覆蓋主 manifest。

### 4.3 Manifest 拆分

目前 manifest 分布：

| Manifest | 筆數 | 用途 |
| --- | ---: | --- |
| `content-source/assets/manifest.json` | 0 | 全域/例外映射保留位 |
| `content-source/assets/travels/202308-east-australia/manifest.json` | 134 | 202308 東澳照片 mapping |
| `content-source/assets/travels/202602-thailand-phuket/manifest.json` | 34 | 202602 Phuket 精細 itinerary mapping |
| `content-source/assets/travels/202607-chongqing-yangtze-river/manifest.json` | 12 | 202607 重慶/三峽素材 mapping |

### 4.4 Seed Parser 擴充

`src/scripts/seed-content.ts` 已支援：

- 讀取全域 manifest。
- 掃描 `content-source/assets/travels/*/manifest.json`。
- 以 local manifest 覆蓋同 sourcePath 的全域設定。
- 保留 manifest metadata：
  - `caption`
  - `day`
  - `sectionId`
  - `time`
  - `location`
- 自動產生 Media tags：
  - `day-02`
  - `section:mai-khao-flight-viewing`
  - `location:mai-khao-beach-flight-viewing-point`

### 4.5 202602 Phuket 精細 Mapping 樣板

以 `202602-thailand-phuket` 建立樣板：

- 整理 gallery、cover、itinerary 圖片資料夾。
- 將 gallery 中精選照片用 manifest 指向 daily itinerary。
- 為 Day 2 飛機起降照片建立精細 metadata 測試。
- 補上 `202602泰国普吉岛8日.md` 的穩定 travel slug：`202602-thailand-phuket`。

### 4.6 202702 Phuket Design Doc

新增設計文檔位置：

```text
docs/design/travel/202702-thailand-phuket.design.md
```

並新增：

```text
docs/design/README.md
```

設計文檔定位：

- 作為 Phase 實作時的頁面風格規格。
- 不作為前台 runtime 直接讀取的資料來源。
- 後續應轉為結構化欄位，例如 `designProfile`、`presentation.template` 或 Payload TravelProjects 欄位。

### 4.7 202607 Slug 統一

已將舊資產資料夾：

```text
content-source/assets/travels/202607-chongqing/
```

統一為：

```text
content-source/assets/travels/202607-chongqing-yangtze-river/
```

並同步 local manifest 中 12 筆 `sourcePath`，確保資產資料夾 slug 與 Travel owner slug 一致。

## 5. Key Files

- `src/scripts/seed-content.ts`
- `src/scripts/seed-content.test.ts`
- `content-source/assets/manifest.json`
- `content-source/assets/travels/202308-east-australia/manifest.json`
- `content-source/assets/travels/202602-thailand-phuket/manifest.json`
- `content-source/assets/travels/202607-chongqing-yangtze-river/manifest.json`
- `docs/content-source-asset-guidelines.md`
- `docs/travel-content-source-guidelines.md`
- `docs/design/README.md`
- `docs/design/travel/202702-thailand-phuket.design.md`
- `docs/travel-projects.md`
- `docs/README.md`

## 6. Validation Commands

已重新執行並通過：

```bash
node - <<'NODE'
const fs=require('fs')
const manifests=[
  'content-source/assets/manifest.json',
  'content-source/assets/travels/202308-east-australia/manifest.json',
  'content-source/assets/travels/202602-thailand-phuket/manifest.json',
  'content-source/assets/travels/202607-chongqing-yangtze-river/manifest.json',
]
for (const p of manifests) {
  const entries=JSON.parse(fs.readFileSync(p,'utf8'))
  console.log(`${p}: ${entries.length}`)
  if (p.includes('202607')) {
    console.log('202607-paths-ok:', entries.every((entry)=>entry.sourcePath.startsWith('travels/202607-chongqing-yangtze-river/')))
  }
}
NODE
```

結果：

```text
content-source/assets/manifest.json: 0
content-source/assets/travels/202308-east-australia/manifest.json: 134
content-source/assets/travels/202602-thailand-phuket/manifest.json: 34
content-source/assets/travels/202607-chongqing-yangtze-river/manifest.json: 12
202607-paths-ok: true
```

其他驗證：

```bash
find content-source/assets/travels -maxdepth 1 -type d -name '202607-chongqing*' -print
rg -n "travels/202607-chongqing/|content-source/assets/travels/202607-chongqing/" content-source docs src -g '!docs/phase-completion-reports/phase-04-1-travel-content-source-readiness.md'
git diff --check
pnpm run test:seed-content
pnpm tsc --noEmit
pnpm run build
```

結果摘要：

- 只找到 `content-source/assets/travels/202607-chongqing-yangtze-river`
- 排除本報告自身後，舊 `travels/202607-chongqing/` 路徑掃描無命中
- `git diff --check` exit 0
- `pnpm run test:seed-content` exit 0
- `pnpm tsc --noEmit` exit 0
- `pnpm run build` exit 0

## 7. Browser QA Scope

本次 Phase 4-1 主要是內容源、manifest、seed parser 與文檔治理，未修改 `/travel/[slug]` 前台 component，因此未執行新的 in-app browser 視覺 QA。

已透過 `pnpm run build` 確認以下 route 可完成 production build：

- `/travel`
- `/travel/[slug]`
- `/blog`
- `/member/[slug]`
- `/timeline`
- `/bucket-list`
- `/wrapped`

後續若將 `designProfile` 或 itinerary metadata 接入前台渲染，需再針對 desktop / mobile 執行 browser QA。

## 8. Known Limitations

- Phase 4-1 變更尚未 commit、push 或建立 PR。
- 工作樹仍包含未追蹤素材與非本次核心內容，例如 Blogger takeout zip、`.DS_Store`、202602/202702 大量素材。
- `content-source/assets/manifest.json` 目前為空陣列，這是預期狀態；後續只有跨專案或全域例外映射才應放回主 manifest。
- Travel design docs 目前只建立文件治理規則，尚未轉為 Payload schema 或前台 runtime template。
- 202602/202702 新旅行資料已可被 seed parser 穩定識別 slug，但後續是否納入正式 seed/PR 仍需按 Phase 範圍決定。

## 9. Next-Phase Readiness

Phase 4-1 已為後續 Phase 建立以下準備：

- 新增旅行項目時可直接按 `docs/travel-content-source-guidelines.md` 準備 Markdown、照片與 YouTube URL。
- 複雜旅行照片可用 local manifest 做 day / section / time / location mapping。
- `202602-thailand-phuket` 可作為已完成行程的精細 itinerary mapping 範例。
- `202702-thailand-phuket.design.md` 可作為規劃中度假型 travel page 的設計來源。
- 後續 Phase 可把 `designProfile` / `presentation.template` 正式納入 TravelProjects seed 或 Payload schema。

## 10. Recommended Handoff

建議下一步：

1. 建立乾淨的 Phase 4-1 或 content-source 專用分支，或確認是否繼續沿用目前 Phase 7 分支。
2. 明確決定本次提交要包含哪些素材：
   - 必含：manifest、parser、guidelines、design docs。
   - 待確認：Blogger zip、202602/202702 全量照片與 Markdown。
   - 排除：`.DS_Store`。
3. 重新執行 `pnpm run test:seed-content`、`pnpm tsc --noEmit`、`pnpm run build`。
4. stage、commit、push，建立 PR。
5. PR 建立後回填本報告的 commit hash、PR URL 與 GitHub sync 狀態。
