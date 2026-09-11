# Issue #117：Source v2 初步缺口稽核

基線：`c770e2b`（2026-09-10 的 `origin/main`）。本文件是實作前稽核，尚非最終 coverage matrix、驗收證據或可執行 v2 契約。

## 已確認的資料路徑

`seed-content.ts` → `travel-seed-projections.ts` → `travel-seed-target.ts` → `reconcileTravelSeed` → Payload。

Daily 另經 `travel-memory-day-projections.ts` → `phase19-travel-memory-backfill.ts` → `reconcileTravelSeed` → `travel-memory-days`。

本次只處理 repository、fixtures 與本地驗證；PR 交人類審查，不沿用先前 #120 的 merge／deployment 授權。

## 必須先解決的 ownership 衝突

- #117 要求每個由作者控制、會影響 Production 的欄位有合法 Source 表達方式，並明列 `presentationStyle`。
- 已接受 `docs/adr/0009-travel-memory-pages-share-one-content-model.md` 明定 `presentationStyle` 由 Admin 管理，不屬於 content-source projection。
- `TravelMemories.ts` 的欄位說明與 `buildTravelMemoryProjection` 目前均遵循此限制。
- 將 style 分類為 cms/system-managed 會混淆人類編輯選擇與系統資料；直接加到 projection 則變更已接受 ownership 決策。

2026-09-10 Human 已批准 Source v2 可選指定 style，依 Base／Source／Current 保護 Admin 變更，並同步修訂 ADR。本項 ownership 阻擋解除。

## 實作缺口與應採處理

| 範圍 | 基線行為／缺口 | v2 所需工作 |
| --- | --- | --- |
| 身分與基本欄位 | catalog 優先 title／slug；日期與 privacy 來自 canonical frontmatter | 明確定義單一輸入及 catalog 一致性驗證，拒絕衝突 |
| participants | projection 接受 members，但模板出行人目前解析為 guestParticipants | 使用家庭成員 stable slug 解析 relationship；未知或重複 slug 阻擋 |
| guestParticipants | name 可從出行人文字解析；note 沒有完整作者語法 | 顯式姓名／備註表格 |
| originPlan | schema 有 optional relationship；Memory projection 未收錄 | 以 Plan slug 表達，精確解析，拒絕不存在或模糊關聯 |
| coverImage／galleryImages | 媒體關係由現有資產流程提供 | Source path 表达作者選擇；解析為既有 Media relationship |
| flights | projection 已涵蓋十個 schema 欄位；舊 seed 強制 flightNumber／route，schema 並未必填 | 對齊可選規則、完整表頭、空值與無效日期驗證 |
| lodgings | projection 已涵蓋十一個 schema 欄位；舊 seed 強制 dateRange，schema 僅 hotel 必填 | 對齊 required／optional 與完整表頭 |
| storySections | role 由標題猜測；模板不能明確表達全部顯示、互動與媒體選擇 | 顯式 section 語意、links、mediaItems、三個互動開關 |
| Day | 日期由 startDate 加 day 推算；dailyHeroImage 未經 day projection／materializer | 支援顯式日期、dateLabel、daily hero source path；保持 day identity |
| Moment | 行程表與照片各生成獨立 Moment；不能完整指定同一片段的文字與媒體 | 完整片段表達 time／location／title／body／transport／placements |
| Placement | source projection role 固定 inline；caption 来自媒體 manifest | 支援 hero／inline／gallery、photo／YouTube、每次使用獨立 caption |
| technical keys | 舊 itinerary key 依時間或位置；Australia Day 3 有保留 identity 特例 | 保留既有 key；新增由 importer 管理，編輯／重排不可靠模糊配對 |
| externalVideos | 舊 seed 強制 title；schema title 可選 | 對齊 title 可選與 URL 驗證；全旅程影片與每日 placement 分離 |
| reminders | 已有 category／items.text 投影 | 加入完整 v2 語法與 omission 測試 |
| Media | 有 altText、tags、relatedMembers、relatedTravelRecord；seed shape 不完整覆蓋所有作者選擇 | 納入逐欄 coverage；資產 altText 與 placement caption 分開 |
| localization | schema 支援 localized 欄位；現有 locale materializer 可 fallback | 明確定義 zh-TW／en 作者語法與省略語系更新行為 |
| 更新省略 | reconciliation 比較 Base／Source／Current 全部 root keys；Source 缺欄不等於未要求修改 | v2 必須在比較前區分省略與刪除，涵蓋 nested group／array／locale |
| 驗證 | 現有 z.object 預設可丟棄未知欄位 | v2 strict validation 與含路徑的可行動錯誤 |

## Golden fixture 與驗證計畫

Australia 原檔保留在原位置。v2 fixture 放測試／artifact 目錄，不讓正常 catalog 掃描視為第二筆旅程。只採版本化材料中實際存在的值；不讀取 Production 來補齊未知內容。synthetic fixture 補齊其餘選項。

驗證必須涵蓋 template 本身、無效／未知欄位、每個作者欄位投影、relationship 解析、技術 identity 重排／更新、省略保留、Admin-only 內容保護，以及無資料庫的 travel audit。不能把函式級的預演聲稱為已完成 Production dry-run。

## 文件對齊範圍

- `docs/templates/travel-memory-source-template.md`：唯一完整作者契約。
- 新增逐欄 coverage matrix：含所有業務、container、array row ID、sourceMetadata、upload／version 系統欄位及分類計數。
- `docs/travel-memory-source-sop.md`：維持新建／更新的人類執行步驟，移除過時 #102 未結案描述。
- `docs/travel-content-source-guidelines.md`、`docs/content-source-asset-guidelines.md`：區分舊／Plan 契約並連結 v2，避免三資料夾被誤讀為必須。
- `docs/travel-projects.md`：對齊 catalog 與新 Memory 作者流程。
- ADR #0009：只有 ownership 決策確認後才修訂。
- 歷史 completion reports 不改寫；最終交付以新的 evidence 文件記錄。

## 目前狀態

2026-09-11：已建立 v2 parser／projection／safe reconciliation／scoped importer 初版、canonical template、coverage generator、澳洲 golden fixture、離線 audit 指令及 focused tests。完成本地 build、build 後 tsc、既有 Phase 21 regression。詳細範圍與未完成門檻見 [本地進度證據](issue-117-source-v2-local-progress.md)。仍在實作，未建立 PR，不是 Issue acceptance／closeout。
