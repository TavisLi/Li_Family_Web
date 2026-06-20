# Phase 8 Production Hardening 設計規格

## 目標

在不新增大型前台功能、不改變既有公開與家人模式行為的前提下，將 Web Li 的媒體、SEO、效能、安全與部署交接提升至可長期維運的 production-ready 狀態。

## 範圍與邊界

- 保留 Payload CMS v3 的既有 Cloudflare R2 S3 adapter；不引入 Vercel Blob。
- Media 繼續只接受圖片上傳；影片只保存經驗證的 YouTube URL。
- 不擴增私密內容的公開讀取權限，也不將任何 secret 傳入 client bundle。
- 不為純 hardening 工作新增不必要的 Payload schema 或 migration；若 collection 實際變更，才產生 type 與 migration。
- 維持 Phase 7 對 Supabase connection pool 的保守順序讀取策略。

## 設計

### 1. R2 與媒體管線

保留 `payload.config.ts` 中以四個 server-only R2 環境變數決定 `s3Storage` 是否啟用的模式。補齊可重用的媒體 URL 正規化 helper，集中處理 Payload media size URL 與可選的 `NEXT_PUBLIC_R2_PUBLIC_URL` public base URL；元件不直接讀取環境變數。

Media collection 維持 `type: photo | video`、`filesRequiredOnCreate: false`、只允許 `image/*` 及既有 thumbnail/medium/large 尺寸。YouTube URL validation 與 optional media relationship 欄位持續保留。

### 2. Metadata、Open Graph 與 JSON-LD

建立 server-safe site metadata helper，集中提供 canonical base URL、公開 OG fallback image 與絕對 URL 生成。App layout 設定 `metadataBase`，主要公開路由使用一致的 title、description、canonical 與 Open Graph image fallback。私密 blog/travel 繼續使用泛用 metadata，避免洩漏內容標題或摘要。

Blog detail 的 JSON-LD 僅對公開文章輸出，並使用 absolute canonical URL 與不為空的 image fallback；不納入私密文章或家人資訊。

### 3. 圖片與效能

`PayloadImage` 繼續承擔圖片載入錯誤、空 URL 與 relation ID 的 `ImageFallback` 降級，並保有明確 `sizes`。資料層只保留已驗證安全的並行查詢；首頁與其他會壓迫 Supabase pool 的流程不改成大範圍 `Promise.all`。

僅在已有重量級 client feature 的路由邊界確認現有 dynamic import；不新增大型依賴或無關重構。

### 4. 安全與部署文件

掃描 `use client` 模組與環境變數使用點，確保 Payload、資料庫與 R2 secret 僅存在 server code。更新 `.env.example` 與部署文件，說明 Preview/Production 必填 server-only variables、公開 URL variables、canonical URL 設定與 R2 public URL 的用途；文件只使用 placeholder。

### 5. 驗證與交接

依序執行 Payload type generation、seed-content test、TypeScript、production build；若 schema 無改動，不建立 migration。啟動本機 server 後以 browser smoke test 檢查 prompt 指定公開與家人門禁路由。無法執行的 seed 或 Vercel Preview/Production 檢查，必須在 Phase completion report 記錄具體 blocker 與替代驗證。

## 測試策略

- 為純函式 metadata/media helper 先新增失敗測試，再實作最小邏輯。
- 對 schema 或 image helper 改動，使用 type generation、seed-content test 與 TypeScript 檢查確認契約。
- 對公開／私密 metadata，加入針對 fallback 和 private guard 的單元測試，避免回歸。
- 以 production build 與 browser smoke test 檢查 route integration。

## 交付物

- R2 / media / metadata hardening 程式碼與測試。
- 更新的 `.env.example` 與部署文件。
- 中文 Phase 8 completion report，記錄 git、PR、Preview/Production、驗證與限制。
