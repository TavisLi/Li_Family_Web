# Production Deployment Checklist

本清單用於 Web Li 的 Vercel Preview 與 Production 發布。所有變數均應透過部署平台設定，不得提交真實值到 Git。

## 1. 環境變數

| 變數 | Preview | Production | 可進 client |
| --- | --- | --- | --- |
| `PAYLOAD_SECRET` | 必填，使用部署 secret | 必填，使用部署 secret | 否 |
| `DATABASE_URI` | 必填，使用 Supabase pooler `:6543` 與 `pgbouncer=true` | 必填，使用 Supabase pooler `:6543` 與 `pgbouncer=true` | 否 |
| `R2_BUCKET_NAME` | 媒體上傳需要 | 媒體上傳需要 | 否 |
| `R2_ACCOUNT_ID` | 媒體上傳需要 | 媒體上傳需要 | 否 |
| `R2_ACCESS_KEY_ID` | 媒體上傳需要 | 媒體上傳需要 | 否 |
| `R2_SECRET_ACCESS_KEY` | 媒體上傳需要 | 媒體上傳需要 | 否 |
| `NEXT_PUBLIC_SERVER_URL` | 當前 Vercel Preview URL | 正式網域 | 是，僅公開站點 URL |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | 可公開讀取的 R2/CDN domain | 可公開讀取的 R2/CDN domain | 是，僅公開媒體 domain |

R2 S3 endpoint 格式為 `https://<account-id>.r2.cloudflarestorage.com`，只供上傳 adapter 使用；不可填入 `NEXT_PUBLIC_R2_PUBLIC_URL`。

## 2. Cloudflare R2

1. 建立或確認 bucket 與 public domain / `r2.dev` domain。
2. 以 Payload Admin 上傳一張圖片，確認 Media record 的 URL 使用 public R2 domain，而非 S3 API endpoint。
3. 確認 thumbnail、medium、large URL 可在無登入瀏覽器中載入。
4. 確認影片 Media record 僅保存 YouTube URL；不可上傳 `.mp4`、`.mov` 或其他原生影片檔。

## 3. Vercel 發布

1. 推送 Phase branch，等待 Preview deployment 完成。
2. 在 Preview 開啟 `/`、`/travel`、`/blog`、`/timeline`，確認沒有 runtime error 或 broken image。
3. 以未登入狀態開啟 `/bucket-list` 和 `/wrapped`，確認導向 family login。
4. 有授權測試帳號時，登入後檢查 `/bucket-list` 和 `/wrapped`；不可把私密資料顯示在未登入 metadata、JSON-LD 或回應內容。
5. 合併 PR 後，確認 Production deployment 使用正式 `NEXT_PUBLIC_SERVER_URL`，並重複第 2 至 4 項。

## 4. 回復與交接

1. 若 Preview 或 Production 發生回歸，先在 Vercel 將最近一次健康 deployment 提升為 Production。
2. 在 PR 與 phase completion report 記錄 deployment URL、時間、驗證結果與任何人工 blocker。
3. 不可將 Vercel、Supabase 或 Cloudflare credential 貼入 issue、PR、report 或 client bundle。
