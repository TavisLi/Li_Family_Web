# Design Documents

本目錄存放專案級與頁面級設計參考文件。這些文件是設計規格、風格基準與後續 Phase 實作依據，不是前台 runtime 直接讀取的資料來源。

## Travel Design Docs

旅遊頁面的設計文檔放在：

```text
docs/design/travel/[travel-slug].design.md
```

範例：

```text
docs/design/travel/202702-thailand-phuket.design.md
```

使用規則：

- 一個 travel slug 對應一份專屬設計文檔。
- 設計文檔可包含色彩、字體、版面、影像語彙、互動語氣與 component 參考。
- 前台頁面不應在 runtime 直接解析 Markdown 設計文檔。
- 實作時應將設計意圖轉為結構化欄位，例如 `designProfile`、`presentation.template` 或 Payload TravelProjects 的對應欄位。
- 若多個旅行共用同一設計方向，可先建立專屬文檔，再在內容中標示共用的 design profile。

推薦 template 命名：

```text
resort-journal
memory-journal
planning-war-room
heritage-landscape
```
