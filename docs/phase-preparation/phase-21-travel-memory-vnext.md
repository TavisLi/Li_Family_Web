# Phase 21 Preparation — Travel Memory vNext content completeness

狀態：Implementing
分支：`codex/phase-21-travel-memory-vnext`
Issues：#94–#102
預計 Completion Report：`docs/phase-completion-reports/phase-21-travel-memory-vnext.md`

## Scope

- #96 canonical contract、可重跑 local/source inventory 與欄位處置矩陣。
- #97 Overview 共用 view model：同行成員、航班、住宿、旅行故事、提醒、global videos。
- #98 Daily parser、Moment transport、Day/Moment/Placement reconciliation 與三套 Daily renderer。
- #99 media ownership、caption/alt 分離、自動 technical keys、unmatched/duplicate report 與 Photos 去重。
- #94/#95/#100：三套 renderer 保持內容完整但 presentation 不同；所有日期可達，無空 footage frame。
- #101：只交付 inventory、migration/rollback rehearsal 與 approval package；不執行 Production/destructive cleanup。
- #102：唯一 canonical completed-memory template、人類 SOP 與 synthetic clean-room fixture。

## Out of scope／未授權

- Production read-only inventory、schema migration、content/media write。
- Preview deployment、merge、Production release、Issue close。
- 刪除 legacy/transition fields、Media relationships 或 rollback evidence。
- 改動 Travel Plan、非 Travel domain 或七筆未追蹤 Phuket planning media。

## Dependency order

`#96 → #97/#98 → #99 → #100 → #101 → #102`；#94/#95 為 #100 的既有視覺 defects owners。

## Minimal design

- `Travel Memory → Day → Moment → Placement` 保持 canonical runtime model。
- Overview/Day/Photos 使用 generated Payload types 派生的 style-neutral view models。
- Moment 新增 nullable localized `transport`；story section 新增 nullable role。兩者 additive、backward-compatible。
- Admin 新增 Moment/Placement 時自動生成 UUID-based key並唯讀；Source stable semantic key 保留。
- Travel-only dry-run/read-back 同時報告 parent 與 child actions；missing Base preserves Current，雙方修改產生 conflict。
- Photos 以 Media asset identity 去重；asset altText 不作 placement caption。

## Verification

1. Contract/projection/reconciliation/renderer focused tests。
2. Payload types generation；migration UP/DOWN review與 disposable rehearsal。
3. `pnpm run build`，完成後 `pnpm tsc --noEmit`。
4. `git diff --check`、secret/migration review。
5. 海南 Family Scrapbook、澳洲 Cinematic、普吉島 Editorial 的 desktop/mobile browser QA。

## Stop conditions

- Production inventory/migration/write 尚未另行批准。
- Generated migration 含 drop、CASCADE、意外 collection 或 data rewrite。
- Dry-run 有 missing media、duplicate placement、unmapped record 或 unresolved conflict。
- Preview/Production commit 不一致、read-back 失敗或 access regression。
