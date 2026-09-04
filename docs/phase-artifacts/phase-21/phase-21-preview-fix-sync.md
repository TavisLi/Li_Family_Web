# Phase 21 Preview 修正同步

日期：2026-09-02。Related to #94–#100；**不是 Phase closeout，也不批准 Production apply／merge。**

## 此次 scoped push

Human 同意依序處理四筆 key 映射、scoped push／Preview QA、185 項補欄位批准包準備。此次只提交以下可發布程式切片，不把資料操作工具／批准清單／七個 202702 Phuket 素材混入 push。

- Daily parser：在 H1／H2 邊界停止；逐表辨識 itinerary header／欄位，不把第二個表頭或旅程總表當作 Moments；移除 12 筆截斷。保留先前的三筆 completed Memory scoped loader。
- 澳洲 Day 3 相容映射：City Circle Tram、Federation Square、St. Patrick’s Cathedral、義大利街分別保持 `itinerary-7`／`8`／`9`／`10`；舊錯誤表頭的 `itinerary-6` 不再使用。來源 title＋下午 time 必須精確匹配且唯一，否則 BLOCK；重複 key 或占用 reserved key 也 BLOCK。不是模糊比對，不改 Production key。
- 公開 R2：只有 public URL 存在且 storage disabled 時附加純 afterRead URL projection；原圖／三個 image sizes 不再依賴 storage credentials。不新增環境變數，不啟用上傳，不改 Media access 或 schema。

## 實際證據

- Key regression 修正前 RED（`itinerary-6` ≠ `itinerary-7`），修正後 PASS。
- `pnpm run test:phase-21`：PASS；含 7 組 Daily parser／identity tests，以及全部 25 個正式 Source Days 的 parser → child projection。
- `pnpm run test:r2`：15 checks PASS，三組 config（public read-only／storage enabled／no public URL）。
- Production 四筆精確 READ ONLY probe：Current 與 Base 的 key／title／time 均匹配，兩次獨立交易回讀相同；`DAY3_IDENTITY_READBACK_PASS`，rows 4、writes 0、schema push false。沒有讀取或寫入其他旅程內容。
- Build、post-build TypeScript、diff check：PASS。Build 使用合成 localhost:1 DB／合成 secret、空 R2 storage credentials、`.invalid` public URL、schema push false。不以本地測試替代線上圖片載入。

## 尚未完成／安全邊界

- Parser 的正確 Source 現在包含海南先前截掉的 10 筆活動，且排除澳洲 12 筆誤讀 rows；這不是批准新增／刪除 Current Moments。禁止通用 seed／source-wins。
- 原 185 項候選 frozen artifact 保留。其新 preflight／Base／versions／timestamps／physical row reconstruction、backup／rollback 與最終 Production content write 仍獨立處理。
- 本地工具與大型資料 artifacts 尚未同步進本次 PR；PR 不宣稱它們已可執行。
- #101 retirement、完整多尺寸／Photos／accessibility QA、release／Issue closeout 仍有剩餘工作，Phase 21 未完成。
- Preview 待 Git deployment ready 且 commit 一致後，以既有 Chrome session GET-only 驗證正式三筆 Overview／Daily／Photos；不開 Admin、不呼叫 write API、不改環境／schema／內容、不 merge。

## 回退

程式以本次 commit 為單位回退；沒有任何 Production schema／content mutation 需要回復。回退 parser 不表示可以恢復使用錯誤 Source 匯入；任何 import 都須獨立 preflight。
