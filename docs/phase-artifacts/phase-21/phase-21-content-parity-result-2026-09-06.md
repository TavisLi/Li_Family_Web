# Phase 21 #101 Content Parity Read Result

狀態：**READ PASS／A 已選擇／本地 C1 已完成／未批准 deploy 或 cleanup**

## Production 唯讀證據

- Node `20.20.2`、`NODE_ENV=production`、`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。
- 單一 repeatable-read read-only transaction；SQL statement timeout `15s`。
- 25 組正式 Travel Memory Day 配對、28 個受限查詢、回應總量 189,308 bytes。
- 本機 Git-ignored 私有快照：`.phase21-private/c0-20260906T064514018Z/snapshot.json`。
- SHA-256：`dfa36ab87def0940ba4cee9f652fe1f6ff875675cda8dedc223bf706b0d157b2`。
- Production writes：`0`。

執行前 drift 診斷確認 Australia `day-03` 新增 1 筆已發布 Placement（version id `121`，20 → 21）；Australia `day-02` latest id `117` 為 autosave draft，Placement 雜湊與 published id `107` 相同。修正版 gate 只允許 canonical Placement 增加；parent 其餘欄位與既定 104 筆 legacy candidate 的 identity／key／media 均維持精確鎖定。

## 離線比較結果

### Day locale fields

| 狀態 | 數量 |
| --- | ---: |
| EXACT | 82 |
| EMPTY | 84 |
| FALLBACK_CANDIDATE | 82 |
| LEGACY_EMPTY_LOCALE_MISSING | 89 |
| DIFFERENT | 4 |
| CANONICAL_ONLY | 5 |
| LEGACY_ONLY_LOCALE | 4 |

需決策的非等價欄位集中於 Australia：

- `day-01`: `zh-TW title` 不同；`en title` 僅 legacy 有值。
- `day-02`: `zh-TW title`、`zh-TW meals_lunch` 不同；對應英文欄位僅 legacy 有值。
- `day-03`: `zh-TW title` 不同；`en title` 僅 legacy 有值。

公開報告不保存正文；完整內容只留在上述私有快照。

### Segment → Moment

- 446 個 locale segment = 223 個 legacy segments × 2 locales。
- 223 個有相同 locale 的 canonical Moment 候選；英文主要沒有 direct locale，將依賴 `zh-TW` fallback。
- 148 個中文候選的 activity/title + notes/body 同時相符。
- 0 個符合 time + activity/title + notes/body + transport 的完整 tuple。
- 因此不得把日期／順序／部分文字相同誤當 stable identity，也不能宣告逐筆內容 parity。

## 產品決策 gate

### A. Canonical-authoritative cutover（建議）

接受目前已發布的 canonical Day／Moment 為唯一 runtime 內容；英文缺值沿用明確的 `zh-TW` fallback。舊 segment 文本不再視為必須逐字保存的 runtime contract。之後才可實作 C1 consumer cutover、fallback counter、Preview QA 與零 legacy-read 觀察期；cleanup 仍需另行批准。

影響：Australia day-01～03 的上述欄位，以及部分 segment wording／transport，會以 canonical 已發布內容為準，不保證與 legacy 完全相同。

### B. Preserve-legacy migration

先建立人工核准的 segment → Moment mapping，將 legacy-only／different 內容補入 canonical，再重新 publish、read-back 與 parity。這是獨立 Production content mutation，必須另備 approval package；在完成前不得 cutover 或 cleanup。

## Stop condition

2026-09-06 Human Owner 已選擇 A；本地 C1 consumer cutover 隨後完成並通過驗證，詳見 `phase-21-101-c1-local-cutover-2026-09-06.md`。這不授權 push、deploy、Production mutation 或 cleanup；C2 Preview／觀察期仍是下一個 gate。
