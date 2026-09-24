# #114 Design Skill responsibility model

本文件只處理設計任務的選用與衝突。先辨認實際需求，再讀需要的 Skill；不要把下表當每次 UI task 的載入清單。權限仍依 `AGENTS.md`。

## 執行鏈

1. **Creative direction**：新頁或明確 redesign 選 `design-taste-frontend` 作唯一 Primary Creative Director，寫一行 design read。普通 UI 小修沿用既有模式，不啟動 Creative Director。
2. **Product language**：按受影響段落讀 `li-family-design-system` 指向的 [visual system](./li-family-visual-system.md)；選 Standard／Premium／Showcase 與 presentation family。
3. **Implementation**：`shadcn-stack` 核對實際版本、組件與 aliases；需要官方 API 細節才載入 `vercel-plugin:shadcn` 或官方文件。
4. **Visual QA**：`visual-qa` 依變更範圍選 route、viewport、state；記錄對等前後證據及缺口。

順序：目前使用者需求 → Li Family product／visual contract → repository architecture／current stack → task-specific Creative Skill → generic Skill defaults。任何 Skill 的字體、色票、圖示、CSS framework、套件或動效建議，都不能靜默取代較高層決策。若 generic 指令要求改用 Phosphor、Tailwind v4、第二套 design system 或全頁動畫，保留其設計意圖，但在本專案以現有 Lucide／Tailwind 3／shadcn 和最低足夠 motion tier 實作；要變更技術棧需獨立 Issue 與授權。

## 現有能力盤點

| Skill／來源 | Role | 重疊／衝突與路由決定 |
| --- | --- | --- |
| `design-taste-frontend`／repo | **PRIMARY** | 唯一 Creative Director；七份 reference 按需載入。其舊 generic install／font／icon 建議都低於產品與 stack。 |
| `li-family-design-system`／repo | **PRIMARY product contract** | 定義共有 DNA 與四種 presentation family；不取代 Creative Director，也不授權既有頁面改版。 |
| `shadcn-stack`／repo | **SUPPORTING implementation** | 讀現行版本與組件；解決 Creative Skill 與 repo stack 衝突。 |
| `visual-qa`／repo | **SUPPORTING acceptance** | 對變更範圍做視覺／互動回歸；不擴成整站矩陣。 |
| `redesign-existing-projects`／repo | **SUPPORTING existing-page audit** | audit → diagnose → targeted improvement；不另立第二 Creative Director，不因通用 checklist 改字體或重寫功能。 |
| `high-end-visual-design`／repo | **SPECIALIST** | 只在明確 Showcase 需求選用；舊的「所有元素進場、換圖示與字型、巨大留白」與本產品衝突，已收斂為受目的和 visual system 約束的技法。 |
| `minimalist-ui`／repo | **CONDITIONAL** | 只有使用者選定該方向才讀；其禁 Lucide／指定 palette 為通用示例，不是專案規則。 |
| `industrial-brutalist-ui`／repo | **CONDITIONAL** | 只限明確選定的視覺實驗；不污染 ordinary UI。 |
| `brandkit`／repo | **SPECIALIST** | 身份或 logo 概念圖；不是 application UI implementation authority。 |
| `image-to-code`／repo | **CONDITIONAL** | 使用者要求 image-first 設計工作流時才使用；與日常 coding 路線互斥。 |
| `imagegen-frontend-web`／repo | **SPECIALIST** | 指定網站概念圖時用；頁面數量預設不適用於普通 UI 修正。 |
| `imagegen-frontend-mobile`／repo | **RETIRE／MERGE candidate for this web repo** | 針對原生 app 概念圖，Web Li 一般需求不載入；保留檔案，日後若明確有 app 工作再評估。 |
| `stitch-design-taste`／repo | **CONDITIONAL** | 只為明確要求的 Google Stitch `DESIGN.md`；不可成為 Web Li 第二份產品視覺契約。 |
| `frontend-design`／Codex plugin | **CONDITIONAL reference** | 與 Creative Director 高度重疊；只有使用者指定該 plugin 或需特定技法時載入，不同時主持方向。 |
| `vercel-plugin:shadcn`、`vercel:shadcn`／Codex plugins | **CONDITIONAL implementation reference** | 需要 CLI／API 細節時擇一，先核對本 repo `components.json` 與 package 版本；不執行 `init` 或 `add` 作為普通 UI 預設。 |
| `imagegen`、`imagegen-frontend-web` 等產圖能力 | **SPECIALIST** | 明確產圖／編修要求才啟用；圖片不自動成為已發佈內容。 |

## 避免重複載入的例子

| Task | 載入 | 不需載入 |
| --- | --- | --- |
| 修一個現有 button 的 focus | 受影響 component、visual system 的互動／狀態段落；必要時 `shadcn-stack` 和 `visual-qa` | Creative Director、redesign、全部 references、產圖 |
| 新 Travel Editorial 頁 | `design-taste-frontend`、visual system 的共通＋Editorial 段落、需要的 typography/layout reference、`shadcn-stack`、`visual-qa` | Showcase、高階動效、其他 presentation 的完整手冊 |
| 既有頁面視覺 polish | `redesign-existing-projects`、visual system、`visual-qa`；若要求重新定方向則加唯一 `design-taste-frontend` design read | 全面重寫、通用產圖 workflow |
| 明確 cinematic Showcase | `design-taste-frontend` 加 `high-end-visual-design` 的特定技法、visual system motion contract、`visual-qa` | 將 Showcase 設為全站預設 |

## Context 效率量測口徑

以 `wc -c` 的 UTF-8 檔案 bytes 當 **model-visible context 上限代理**，不是 token telemetry。#114 基線 `design-taste-frontend/SKILL.md` 為 2,023 bytes，單一深層 reference 為 86,935 bytes；整份載入合計 88,958 bytes。修改後入口為 2,257 bytes；七份 reference 各約 2.4–23.8 KB。例：只需 interaction guidance，入口＋`interaction.md` 約 4.6 KB；若要全部內容，仍須支付約 89 KB，故路由規則是必要部分。普通既有模式小修不載入 Creative Skill。

每個實際設計任務另記：載入檔名／bytes、工具呼叫數、迭代回合；無可靠 telemetry 時不報 token 節省。視覺品質需同 route、data、state、viewport 的前後比較；不能把本文件或既有舊截圖當品質提升證明。#114 的 [benchmark](../phase-artifacts/issue-114/visual-benchmark.md) 記錄現有證據與缺口。
