# Issue #114 — local delivery and verification

日期：2026-09-24。分支：`codex/phase-114-design-governance`。起點：`origin/main`／HEAD `d72376dbd9f017d8b41f67d9915e58725b9c29fe`；開工前工作區乾淨。

## 本地交付

- [Visual system](../../design/li-family-visual-system.md)：共同 DNA、四個 presentation family、Standard／Premium／Showcase、typography、color、spacing、component、image、navigation、motion、responsive、accessibility 與狀態。
- [Skill routing](../../design/skill-routing.md)：全部現有 design Skills 的 role／重疊／衝突盤點，唯一 Creative Director 與按任務載入路徑。
- `design-taste-frontend`：精簡入口，原單檔 reference 依 typography、layout、motion、interaction、design-systems、anti-patterns、redesign 分成七份；保留原有技法段落，改成明確的按需選用。
- 新增 `li-family-design-system`、`shadcn-stack`、`visual-qa`；收斂 `redesign-existing-projects` 為既有頁面 audit／targeted refinement，`high-end-visual-design` 為 explicit Showcase specialist。兩者原有技法保留在按需 reference，入口不再整份載入。
- `AGENTS.md` 與 context lookup 加入最短路由指引；[visual benchmark](./visual-benchmark.md) 記錄歷史證據、可比對矩陣與尚未驗證的部分。

## 本地檢查

| Check | Result |
| --- | --- |
| `git diff --check` | Pass |
| Skill frontmatter 與 name／description 解析（repo 現成 `js-yaml`） | 6 個新增／修改入口 Pass |
| Skill 與文件相對連結存在 | Pass |
| 原 reference 的編號 §0–§14 與 §4.1–§4.11 在七份檔案中可找到 | Pass |
| 新檔尾端空白檢查 | Pass |
| `package.json`／`components.json`／`tailwind.config.ts` 與 guidance 對照 | Next 15.4.11、React 19.2.1、Tailwind 3.4.17、shadcn `radix-nova`、Lucide 相符 |
| Application build／TypeScript／runtime QA | N/A：本次僅 Skill 與文件，沒有 application code、schema 或 executable config 修改 |
| Browser 比對 | 未完成；舊 Travel 截圖只能作歷史基線，詳見 benchmark |

`skill-creator` 原 `quick_validate.py` 在目前兩個 Python runtime 都因缺 `yaml` 模組無法啟動；未安裝依賴。以上 YAML 與結構檢查用 repository 現成 `js-yaml` 執行，不等同於該腳本完整執行。`playwright` CLI wrapper 在此環境等待套件解析而未啟動，已停止；沒有因此連線 Preview／Production。

曾嘗試以暫時的純本地 synthetic script SSR `HomePageView` 補首頁基準圖；該 component 的 client subtree 匯入 server action，離開 Next runtime 後找不到 `server-only` package，因此無法產出可信的實際 renderer 截圖。暫時 script 已移除，沒有修改 app、DB 或 env；首頁 browser 項目維持 `UNKNOWN`。

## Acceptance status

本地 Skill／visual contract／stack guidance／routing／effort tier／motion tier 已交付。Visual quality 的三種代表頁面 **同條件前後回歸**、實際 tool-call／iteration 對照仍未取得；相關項目維持 `UNKNOWN`，Issue 不可據此宣告全部完成或關閉。

未執行 Production mutation、Tailwind migration、Node upgrade、全面 redesign、Preview deployment、Production read、GitHub Issue／PR 修改或 merge。沒有 schema、content、media 或 access 行為變更。

## 2026-09-24 follow-up

本報告上文記錄初次 Skill／文件交付當時的檢查。之後依使用者授權完成三個代表畫面的本地合成資料 BEFORE／AFTER、最小 UI 修正、browser QA 與無 `.env` 建置；請以 [representative UI validation](./representative-ui-validation.md) 為最新證據。

| Issue #114 acceptance area | Final evidence |
| --- | --- |
| Skill role／overlap inventory；唯一 Creative Director；existing-page audit；Showcase-only specialist | [Skill routing](../../design/skill-routing.md)、各 Skill entrypoint 與按需 references |
| Product visual contract；presentation families；Standard／Premium／Showcase；motion／reduced-motion | [Li Family visual system](../../design/li-family-visual-system.md) |
| Progressive disclosure；stack precedence；無依 generic defaults 換 framework／icon／dependency | 七份 design reference、`shadcn-stack` 與既有 local stack 核對 |
| Representative UI regression、generic patterns、Skills/context bytes、iterations | [三表面本地 BEFORE／AFTER 報告及 screenshots](./representative-ui-validation.md) |
| Production mutation、Tailwind migration、Node upgrade、full-site redesign exclusions | 未執行；UI 修正限於三個已核對 source 檔，全部素材為本地合成資料 |

此分支供 #114 人工審查；PR 以 `Closes #114` 連結 Issue。本次授權包含推送此指定分支並建立 PR，不包含 merge。沒有修改 Issue 本文、Preview、Production、schema 或 content／media。
