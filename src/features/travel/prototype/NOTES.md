# Travel Memory prototype 決策紀錄

本 prototype 是本地、無 persistence 的評審工具，不是正式 renderer。

已批准方向：

- Editorial journal、Cinematic timeline、Family scrapbook 三者都成為正式支援的 Travel Memory presentation style。
- 每筆 Travel Memory 配置一種樣式；同一筆 Memory 的 Overview、Daily chapter 與 Photos 維持一致。
- 三種樣式共用同一組 Memory／Day／Moment／Placement 資料與 route-facing view models。
- YouTube placement 維持獨立 vertical slice。
- Production schema、content backfill 與 runtime cutover 分開執行及批准。

網站擁有者於 2026-08-02 確認的三筆初始配置：

- `201307-hainan` → `family-scrapbook`
- `202308-east-australia` → `cinematic-timeline`
- `202602-thailand-phuket` → `editorial-journal`

此確認是產品配置決定，不構成 Production write 批准。

正式實作不得直接提升本資料夾的 prototype code；應依批准後的 style-neutral data interfaces 重寫三個 renderer，並在完成後刪除 prototype switcher。
