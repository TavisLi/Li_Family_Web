# Phase 21 clean-room manifest 與 projection 驗證

日期：2026-09-03。狀態：`LOCAL_PROJECTION_VERIFIED_FULL_CLEAN_ROOM_INCOMPLETE`。本輪未提交／推送／部署／merge，未連 Production。

## Human 已批准的最小修正

獨立 manifest `altText`；新 canonical Memory 必填、caption 僅作敘事位置文案；三筆既有 Source 暫保留相容行為且精確比對，不修改 Production。

先以 synthetic manifest 重現兩個 RED：提供 altText 仍被 caption 取代；移除 altText 仍被接受。修正後均 GREEN，空白 altText 也會拒絕。

- `manifestEntrySchema` 接受 trim 後非空的 optional altText，scanner 優先採用它。
- 新 canonical Memory 的每張照片必須有 manifest altText；缺少整筆 manifest 也不能靠檔名／caption 通過。
- Parser 回傳非持久化的 optional `sourceFormat=canonical-memory` discriminator，僅用於 source builder 的 media validation；runtime projection 明確不包含此欄位，不新增 Payload schema／migration。
- 完整與 scoped source builder 都將解析模式帶到 scanner。三笔既有舊格式不受必填 gate 影響；沒有改動它們的 Markdown、manifest、日期、標題或媒體。
- Canonical template 增加 manifest entry 範例，SOP 說明必填欄位／legacy 邊界及本地檢查命令。

## 本地 clean-room 能證明什麼

命令：Node 20.20.2 下 `pnpm run test:clean-room`。

`phase21-clean-room-check.tsx` 在專用暫存目錄建立全新 slug、直接讀 canonical template、加入一支日期對應的 synthetic daily film、一張小型 PNG 與 manifest。通過真實 catalog parser、scoped source builder、parent projector、Day materializer、dry-run planner、shared view models 與三套 React renderer。只有資料庫回應是 fake，沒有 Payload init。

- 一筆 parent／兩個 Day；manifest photo 進入 Day 2 的 Moment，caption 與 altText 分離。
- 全旅程 film＋Daily film 納入 Photos，parent／Daily 重複影片去重；Day 2 video filter 只有該日影片，Day 1 不包含全旅程影片。
- 三套樣式共12份HTML：Overview、兩份Daily、Photos。檢查同行者、航空公司／航班／起降時間、住宿、transport、caption／alt、Day links；未知 slug 不需新增 style 白名單。
- `phase-21-clean-room-projection.json` 保存真實執行輸出。

## 修復後說明：首次 dry-run 缺口已解除

本節原先記錄 parent 不存在時漏列 Daily；2026-09-04 經 Human 確認報告契約後已修復。首次 dry-run 現以 `slug:dayKey` 列出兩個預計 Day create，並以 `dependsOn` 明示 parent／media建立依賴，不捏造 DB ID。詳見 `phase-21-new-memory-dry-run-design.md` 與更新後 `phase-21-clean-room-projection.json`。

寫入 planner 的 missing-ID gate與executor均未修改；這仍只是報告預測，沒有實際執行 seed import。unmatched／duplicate media與跨collection slug collision仍為conflict。

另未驗證：實際 Payload persistence／hooks／access、Browser layout／鍵盤／圖片載入、R2 bytes／YouTube 播放。靜態 HTML PASS 不取代这些 gate；#102／Phase 21 仍未完成。

## 三筆正式 Source 沒有差異

`phase-21-manifest-source-regression.json`：從 HEAD `4d49261` 取出舊 parser，在本機執行；先確認其 SHA-256 與修改前 artifact 相同。與新 parser 的整份 scoped SeedContent 使用 deepStrictEqual 比較，包含所有 MediaSeed altText／caption／tags／ownership／source paths；結果完全相同。

- 海南：8 Days／357 media。
- 澳洲：9 Days／134 media。
- 202602 Phuket：8 Days／233 media。
- 合計：25 Days／724 media；parent 和完整 Day projection hashes 也均與原基線一致。

暫時的舊 parser 副本已移除，沒有移除使用者檔案。此結果是 Source regression，不是 Production Current read-back 或資料恢復證據。早前 `phase-21-canonical-source-after.json` 保留為 metadata 修復時點的歷史證據，不把其中舊 parser checksum 當成本輪現況。

## 驗證與安全界線

- `test:clean-room`、`test:phase-21`、`test:seed-content`、canonical contract test PASS。
- 隔離 build PASS：localhost:1 synthetic DB、synthetic secret、空 R2 credentials、`.invalid` media URL、schema push=false；未使用真實外部服務。
- Build 後 `pnpm exec tsc --noEmit`、`git diff --check` PASS；clean-room check 已納入 `test:phase-21` 固定測試鏈。
- Production 連線／資料與 schema 寫入為0。既有海南事故、Production CONNECT BLOCK、185項apply、Preview部署、cleanup、merge與Issue closeout均未解除。
- GitHub DNS在前輪讀取失敗；本輪未重試 external inspection，不以本地成功推導PR／Production狀態。
