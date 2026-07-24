# Preview／Production Deployment Checklist

更新日期：2026-07-24

本清單用於 Web Li 的 Vercel Preview、Production code release 與適用的 Payload data release。Vercel `READY` 只證明 deployment build 完成，不代表 runtime、database、metadata、access 或內容正確。

## 1. Release Identity

- [ ] Branch／PR：
- [ ] Expected commit：
- [ ] Vercel deployment ID／URL：
- [ ] Deployment target：Preview／Production
- [ ] Deployment metadata 的 Git commit 與 expected commit 相同。
- [ ] Rollback candidate 已記錄。

## 2. Environment Variables

| 變數 | Preview | Production | 可進 client |
| --- | --- | --- | --- |
| `PAYLOAD_SECRET` | 必填，部署 secret | 必填，部署 secret | 否 |
| `DATABASE_URI` | Supabase pooler | Supabase pooler | 否 |
| `R2_BUCKET_NAME` | 上傳需要 | 上傳需要 | 否 |
| `R2_ACCOUNT_ID` | 上傳需要 | 上傳需要 | 否 |
| `R2_ACCESS_KEY_ID` | 上傳需要 | 上傳需要 | 否 |
| `R2_SECRET_ACCESS_KEY` | 上傳需要 | 上傳需要 | 否 |
| `NEXT_PUBLIC_SERVER_URL` | Preview URL／批准的 environment-aware URL | `https://li-family-web.vercel.app` | 是，公開 URL |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public R2/CDN domain | Public R2/CDN domain | 是，公開 URL |

- [ ] Server secret 沒有 `NEXT_PUBLIC_` prefix。
- [ ] R2 public URL 不是 `r2.cloudflarestorage.com` S3 API endpoint。
- [ ] Production Node runtime 與 project baseline Node 20 相容。

## 3. Local Release Gate

- [ ] Focused tests。
- [ ] `pnpm exec payload generate:types`（Collection 變更時）。
- [ ] `pnpm run build`。
- [ ] Build 完成後 `pnpm tsc --noEmit`。
- [ ] `git diff --check`。
- [ ] Secret／credential scan。
- [ ] Generated migration 已人工審查。
- [ ] Working tree 沒有非 scope changes。

## 4. Preview Runtime Gate

按 scope 驗證：

- [ ] `/`
- [ ] `/travel`
- [ ] `/travel/[slug]`
- [ ] `/blog`
- [ ] `/blog/[slug]`
- [ ] `/timeline`
- [ ] `/bucket-list`
- [ ] `/wrapped`
- [ ] `/family/login`
- [ ] `/admin`
- [ ] `/api/og-default`

### Mode／device

- [ ] Public desktop。
- [ ] Public mobile。
- [ ] Family desktop／mobile（有授權帳號時）。
- [ ] Unauthorized route／interaction。
- [ ] Loading／error／empty states。

### Privacy

- [ ] Private record 不在 public body。
- [ ] Private record 不在 rendered HTML／RSC。
- [ ] Private record 不在 metadata／JSON-LD。
- [ ] Private R2 relationship 不被 public response 洩露。

## 5. Metadata and SEO Gate

對 `/`、`/travel`、一個 travel detail、`/blog`、一個 blog detail 抽查：

- [ ] Canonical 使用目前環境網域。
- [ ] Production canonical 不含 `localhost` 或 Preview domain。
- [ ] Open Graph URL／image 使用可公開的正式 URL。
- [ ] Twitter image 可公開存取。
- [ ] Title／description 與頁面內容一致。
- [ ] JSON-LD 沒有 private content。

如果頁面 HTTP 200 但 canonical／Open Graph 指向錯誤環境，release 尚未 Production verified。

## 6. Cloudflare R2

- [ ] 至少一個本次相關 R2 original URL 回應成功。
- [ ] 適用的 thumbnail／medium／large 可載入。
- [ ] Payload Media relationship 指向正確 record。
- [ ] 沒有因單一缺圖全量重傳 media。
- [ ] YouTube 只保存 URL／metadata，沒有原生影片上傳。

## 7. Content／Data Sync Gate

### 7.1 一般規則

1. 執行 domain audit／dry-run。
2. 記錄 environment、collection scope、create／update／preserve／conflict／skip／delete。
3. 有 conflict 時停止 safe write，提交決策。
4. 取得 Production mutation 批准。
5. 執行被批准的窄 scope command。
6. 執行 domain-specific full read-back。
7. 重新 dry-run 檢查收斂。
8. 抽查 Admin、public route、family route 與 media。

### 7.2 Travel

```bash
pnpm run seed:audit
pnpm run seed:travel:dry-run
# 批准後
pnpm run seed:travel
pnpm run seed:travel:read-back
pnpm run seed:travel:dry-run
```

- [ ] Mutation 只包含 `travel-plans`／`travel-memories` 與批准的 media／relationships。
- [ ] 不日常寫入 legacy `travel-projects`。
- [ ] Admin-only edits 是 preserve。
- [ ] Conflict 已有 owner decision。
- [ ] Read-back 驗證 route identity、visibility、relationships、source metadata。

全量 `seed:phase-9` 不作為單一 Travel Phase 的預設 Production write。

## 8. Migration Gate

- [ ] Production inventory。
- [ ] Migration／implementation hash。
- [ ] Disposable/local rehearsal。
- [ ] Negative／drift rehearsal。
- [ ] Before／after query。
- [ ] Rollback。
- [ ] 網站擁有者批准。
- [ ] Apply 後 migration record read-back。
- [ ] Existing records row count／null／default 驗證。
- [ ] Runtime route 驗證。

Data-loss warning、baseline drift 或 unexpected target 時停止，不確認互動 prompt。

## 9. Production Gate

合併後：

- [ ] Production deployment 對應 merge commit。
- [ ] 關鍵 routes 回應預期 status。
- [ ] 實際 rendered HTML 有完整內容，不只 loading shell。
- [ ] Metadata Gate 全部通過。
- [ ] Public／Family boundary 通過。
- [ ] Runtime logs 無持續 5xx／pool timeout。
- [ ] 適用的 data read-back 通過。
- [ ] Observation window 已記錄。

## 10. Rollback

### Code

1. 將最近健康 deployment 提升為 Production。
2. 驗證 route、metadata、access。
3. 記錄 incident、deployment 與後續修復。

### Data

Vercel rollback 不回復 Payload／Supabase data。資料錯誤時：

1. 停止後續 mutation。
2. 保存 dry-run／read-back evidence。
3. 使用被批准的窄 scope repair／rollback。
4. 不以全量 seed 或 delete 猜測修復。

## 11. Human Approval

必要 HITL：

- [ ] Issue／PRD publication（如適用）。
- [ ] Production private inspection scope。
- [ ] Migration apply。
- [ ] Content／media write。
- [ ] Conflict resolution。
- [ ] Destructive cleanup。
- [ ] Merge／Production release。
- [ ] Known limitations／Phase acceptance。

## 12. Handoff

Completion Report 記錄：

- Branch／commit／PR／merge
- Preview／Production deployment
- Commands and results
- Browser／HTML／metadata scope
- Data／migration／read-back
- Known limitations
- Rollback
- Closed／open Issues
