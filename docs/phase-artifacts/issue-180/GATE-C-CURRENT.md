# Issue #180 Gate C — accepted synthetic result

**Current: r27 isolated synthetic Gate C PASS; PR #181 remains Draft.** Human accepted this result and the scoped B1 decisions on 2026-11-02. Production readiness is UNKNOWN. Earlier r1–r26 BLOCK/UNKNOWN reports remain historical evidence and do not describe the current synthetic result.

## Exact evidence

- Tested baseline HEAD: `ee0130375bca35306323f63498f3e74dd17fed30`, with separately bound working-tree code; it was not a clean commit of the final code.
- Run: `issue180-f5dc1b3f34b80b5f84aae12ef6c5c503`.
- Canonical manifest SHA-256: `080a0efa31c9815bcf27cde00383efe5af8dce0cac0b750576c82a12fa85001c`.
- Raw manifest SHA-256: `6e06167bb2aec99ebd1bd2a3b4c9078f828591f66948b7ef58c887d52fd4a82a`.
- Terminal receipt: `e2a4e034bb2540059754491512e3121b235c2555b13cb5256320d6b0f310bc05`; terminal ledger: `38e3b0dfd994cfaca1fcaec08210cd7fe0d15f9ce2989ac6559c15fc06e7772f`.
- 20/20 terminal cases PASS, zero warnings, one invocation and no retry. Main and both controlled failure/abort probes independently verified database/server/directory/process/PID/socket absence. Probe BLOCK outcomes were expected and are not matrix failures.
- Restore compared all existing logical catalog properties and live-column relative order, full physical row contents and retained history. It recorded 24 physical ordinal differences; absolute physical column ordinals were not required to match. The separately saved restore-DB SQL count returned `0`.

[Sanitized evidence index](r27-evidence-summary.json) retains the result and artifact hashes. [Source-byte mapping](r27-source-byte-map.json) compares published repository files with the historical manifest bindings. These summarize an existing run; neither grants execution authority nor claims that a later commit was run under r27.

Full immutable receipts, ledger, manifests, approval/read-back records and original preparation/diagnosis history remain in the maintainer's original `.issue180-gate-c-work` evidence archive under the run ID above. They are excluded from this PR. The original archive is not cleaned, rewritten or replaced by this publication index. Future execution requires a fresh exact manifest/approval; r27 approval is consumed.

## Accepted product decisions

- **Memory import is V2-only.** Memory V1 is retired, with refusal before store I/O; this is a deliberate compatibility change, not successful V1 compatibility. Plan legacy import remains supported by `--travel-only --plans-only`. Existing Memory data/Base/identities/history are preserved. New V2 Media intake/upload remains separately gated.
- **Shared transaction try-lock fail-fast is accepted.** All three Travel collections share the lock for create/update/delete/restoreVersion. Busy unrelated Travel edits and autosave can be rejected. Reads do not acquire this lock. This accepts the current safety/availability tradeoff, without asserting real-traffic conflict rates or Admin UX readiness.
- **`maxPerDoc=0` is conditionally accepted for current history preservation.** Plan/Memory/Day automatic version pruning remains disabled. Long-term storage/backup cost and retention policy remain follow-up acceptance; pruning/deletion has no authority from this decision.

## Remaining acceptance and publication limits

[Follow-ups](pr181-follow-ups.md) retain Admin unsaved-state/edit preservation, history capacity/restore cost and Production fidelity. They do not block narrow Draft PR publication; their completion must not be inferred from synthetic PASS or CI.

The new published head must receive applicable CI. Historical r27 evidence is reusable only for identical bound source bytes and its original scope. Portable regressions run in the existing offline CI allowlist. Machine/runtime-bound preparation/admission tests remain local verification, not an automatically authorized DB rehearsal.

No Production reads/writes, Production migration, deployment, Preview runtime QA, merge/release or Issue #180 closeout is authorized by this publication. Skipped CI jobs are not PASS.

## Publication validation

The isolated publication checkout passed all 99 files in the existing offline CI allowlist (68 Travel + 31 remaining), 11 CI planning/governance tests, lint, build and subsequent `tsc --noEmit`. Payload type generation with synthetic storage configuration produced no type diff. No database or Gate C run was performed for publication. The existing Phase 21 seed-safety entry now delegates to the behavioral Memory V1 retirement regressions instead of asserting the removed legacy child-sync implementation.

All 115 published repository file bindings in the r27 source-byte map were rechecked. Publication-only documentation, the CI test allowlist and the updated legacy test entry are listed separately; new-head CI is separate from the historical r27 execution.

The first publication head `f857b5696f13af406f6273f7de5e0d6ec691c634` passed application CI and CodeQL, but the historical Issue 158 fixture job rejected the current lockfile against its frozen runtime binding. The historical binding is unchanged. CI routing now distinguishes only the three exact Issue 180 inputs (`binding.json`, `historical-lock.yaml`, `legacy-fixture.sql`) from that unrelated replay; these retain schema/application/offline checks and their accepted r27 evidence. A RED-to-GREEN routing regression verifies that new/unknown rehearsal files, Issue 158 and shared runner changes still invoke the maintained fixture job. A skipped historical fixture job is not a PASS or a new Gate C run.

## 2026-11-07 Production 決策收斂（ACCEPT WITH FOLLOW-UP）

本 addendum 保留上方 historical Gate C／publication 紀錄。PR #181 已合併於 main 的 `8eaa11653c3666b370ea9d2c5588b54f64ae838d`，#180 非 Production 驗收已接受；本次治理修訂基線為 main `824d262474273a5729a470a62483c2ced46f84fa`。Production migration 維持 BLOCK，下一輪只收斂以下三類風險。

| 狀態／風險與後果 | 現有證據 | 最小解除條件／處置 |
| --- | --- | --- |
| 已完成：parent 外鍵與 locale 型別不相容可能使 DDL 失敗 | b02 確認兩個 parent id 為 integer／varchar、非空且有合格單欄唯一鍵；b03 確認 public._locales enum 為 zh-TW、en | 重用本次 metadata 證據；執行前只按漂移需要判斷 freshness |
| 執行 blocker：runner／ledger 或相依 schema 不相容可能使升級拒絕、部分失敗或執行錯誤 migration | b01 有 dev/-1 與歷史 id=7 batch=NULL；其例外只接受 evidence-only 解讀。b02／b03 僅覆蓋部分 DDL 依賴 | 核對選定 runner 對兩項異常的實際行為、pending migration 清單及本次 DDL 所需物件。只補未被既有證據回答的差異，提出可審查處置；warning 停止條件繼續適用 |
| 執行 blocker：DDL 或權限變更可能影響既有資料或暴露 Geo | migration 原始碼、r27 synthetic 與已取得 Production metadata 可重用 | 完成 exact migration 對所需相依物件／權限的差異核對，以及有限鎖定、維護條件和 read-back 計畫；只對具體未解風險補證 |
| 執行 blocker：失敗後無可用恢復路徑可能造成資料損失或服務無法恢復 | r27 隔離 up／empty down／populated down refusal／restore；down 限新欄位與新表仍為空 | 核對實際可用備份與相應恢復證據，指出本次失敗情境的恢復方法。缺口直接影響恢復能力時才追加最小補證，成本與維護風險列待 Human 接受 |
| 後續改善：Admin 編輯體驗、長期 history 容量與完整環境 parity | 原 [follow-ups](pr181-follow-ups.md) 保留 | 只有發現直接導致本次資料損失、安全漏洞或升級失敗的具體證據，才提升為 migration blocker；獨立上線／產品驗收仍依各自範圍處理 |

b01／b02／b03 的本機原始紀錄位於 `/private/tmp/issue180-marker-read-review-20261106-r1/evidence/`，非 repository 可攜證據，需由原持有人保全。此次本地檢查的 CSV 合計 2,841 bytes；SHA-256 分別為 b01 `a679b676f986f99cbe91580197a5a9154c65b17e78518878f7358297478f529d`、b02 `cd35398a602576aaedb10eb4eec9d532f8ce489261666eb5b1864eaf49c6b088`、b03 `cc43ec0fe0bd5f7787d935c727172603e4837c5c16a791f9c67d0231c6efe56a`。以上是已保存觀測，不宣稱新鮮 Production inventory。

唯一下一步為在同一準備任務核對上述三類 blocker，重用有效證據，給出 GO／NO-GO、殘餘風險與精確 migration 批准範圍，停 Human 決策。新增前置工作須指出新的具體失敗風險及最小解除條件。#185／#186 維持暫停。Human 於 2026-11-07 接受治理方向（ACCEPT WITH FOLLOW-UP）；上述技術缺口仍待處理，本次未批准 Production、migration、部署或 merge。

工作區來源已另行核對，結果見 [Playbook §5.2](../../phase-execution-playbook.md#52-工作區與依賴隔離accept-with-follow-up)。#184 的 reader 在其已提交 exact head 可獨立完成 DB-free 測試；#134 dirty 副本不是後續執行來源。main 已合併的共用依賴按版本重用，#184 的正式 Production 入口停用與工作區問題分別判定。後續 #180 準備沿用本次獨立 scope，#181 reader 若仍需修改則回到其所屬分支與獨立授權。
