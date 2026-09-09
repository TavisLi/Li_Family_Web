# #102 範本與人類導入流程修訂

## 本次交付

- 填寫說明移到 canonical template 的 YAML 註解，與正文分離；parser fixture 持續直接使用該檔。
- SOP 改成人類的新建與更新兩條流程，人只需準備材料、審閱整合預覽及批准清單。
- 人類可交單一照片資料夾；已匯入的檔名／source identity 保留。AI 依拍攝時間、時區、GPS 與畫面提出候選配置，批次確認明確項目，逐張確認有歧義者。
- AI 產生 manifest、altText 與 caption；正式配對以前須確認 Overview 封面、每日代表照片、Daily 片段與相簿位置。此為協作規範，不宣稱已有無人值守辨識發布工具。

## 補齊欄位

| 範本可選欄 | parser | Payload |
| --- | --- | --- |
| 航廈 | flights.terminal | travelLedger.flights.terminal |
| 完整日期 | flights.calendarDate | travelLedger.flights.date |
| 入住日期 | lodgings.startDate | travelLedger.lodgings.startDate |
| 退房日期 | lodgings.endDate | travelLedger.lodgings.endDate |
| 住宿備註 | lodgings.notes | travelLedger.lodgings.notes |

原來的航班「日期」仍是 dateLabel，住宿「日期」仍是 dateRange。可選結構化日期使用 YYYY-MM-DD；不以不含年份的文字猜測實際日期。無效日期與退房早於入住拒絕解析。新版欄位解析限 canonical Memory，既有 legacy 格式不自動重寫。

Template 不等於整張 Collection 的編輯表單：presentationStyle、originPlan、系統 metadata、發布狀態與媒體關係各有管理入口；Days 是獨立 collection 的反向關聯。出行人文字目前投影為 guestParticipants，家庭成員 participants 關聯需另外確認，不能假稱名字已自動配對。

## 驗證與尚待驗收

Node 20.20.2 的完整 test:phase-21 通過，涵蓋 25 個正式 Day 的 parser/projection parity、synthetic 新 parent／media、既有 parent 更新、preserve-current、duplicate/unmatched/collision，以及三套 renderer 的 12 份輸出。新增 contract test 實際走 Markdown → parser → Payload projection，確認上述欄位不遺失，並拒絕無效日期與倒置住宿日期。

這些測試沒有連線 Production，沒有執行正式發布，也未證明真實照片辨識的正確率。#102 的最終 Human acceptance 仍需以修訂後 template/SOP 審閱及一次照片配置預覽確認；原結案文件中的 PASS 已撤回。不得以測試通過代替人類流程驗收。

## 回退

本次無 schema migration 或資料修改。程式可透過 revert 本次 parser/projection 變更回退；若日後已使用新增欄位匯入，不可直接拿舊版 parser 再匯入，須先檢查 reconciliation 差異。
