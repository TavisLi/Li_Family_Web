# Revision 2 — 語意保留與刻意變更

候選，未套用。比較基準為已實作的 Slice 2 working files；不是重寫 Slice 1/2 批准或歷史證據。Owner 繼續有效，不代表模型必須開工預讀。以下「原條款」為原文要點，精確全文差異見 candidate.patch。

| 原條款／要求 | 新 core／index 處置與 owning destination | 語意分類 | Safety／authority 影響 |
| --- | --- | --- | --- |
| 明確 precedence、ADR 限定例外、衝突處理 | core「權限與保全」完整順序；proposed 非 accepted | 不變／縮寫 | 不以自主判斷覆寫 canonical authority |
| GitHub、本地、Preview、Prod read、migration、content/media、destructive、merge/release、closeout 分離 | core 逐類列出；細節 Playbook §3–§4、§9、§11–§13 | 不變 | 本地自主不新增外部或 Production 權限 |
| Migration、metadata、content、media、relationship、cleanup 分別批准 | core 逐類保留 | 不變 | 不以一項 write approval 覆蓋其他種類 |
| Issue 拆分需先確認粒度／依賴再批准發布 | 從 core 移除重複流程；Playbook §3.4–§3.6、H2 原有 owner 保留；外部發布前由 core 觸發 gate | 移轉，不變 | 不把一般對話自動發布至 GitHub |
| 批准 target/actions/scope/baseline/env/stops/有效期間/未撤回 | core 全部保留；失效停止、有效不重問 | 不變 | 不自行延展批准；不實作 #105 invalidation |
| 保護 dirty/untracked/assets，不修改、還原、clean、stage、commit | core 逐項保留，明確納入才可變動 | 不變 | 低風險也不例外 |
| 低風險自主，重要歧義才詢問，繼續獨立工作 | core 前置；Playbook H1 限定實質歧義／取捨 | 澄清／加強自主 | 取消重複確認，不移除產品、架構、privacy 決策 gate |
| 每個任務先列 scope/outscope/acceptance/預期修改/stop conditions | 任務理解與回報保留；一般工作不要求額外模板。正式 Phase 的 Playbook §3、§7 保留 | 刻意縮窄流程適用範圍 | 接受少一份重述文件；不接受 scope 擴張或忽略 acceptance |
| 所有實作加入 common intake/Git/validation route | core、index、Playbook §5/§10、Claude 同批取消 compulsory loading | 刻意取消預讀義務 | 取消讀取證明，不取消實際適用的驗證／authority |
| Travel 一律讀 ADR-0001/2/3/6/7；跨域取聯集 | index 改按待解問題找 owner；ADR index 可查；caption 指向 ADR-0009 | 刻意取消固定聯集 | 不能因少讀而猜契約，衝突仍停高風險操作 |
| 最新 main、codex branch、不直推main、既有branch保全 | core 短句；架構 §11、Playbook §5 保留詳細规则 | 不變／縮寫 | 不為 audit 強制 fetch／切 branch；不授權 commit/push |
| 實際版本、對應版本官方 API 文件 | core 明確實際安裝版本；selectors/lock證據細節在架構 §3、Playbook §5.3 | 不變 | 不用最新版文件推定舊API；只有不確定才查 |
| Runtime Payload truth、source input、四種 reconciliation | core 全部保留；架構 §5／ADR-0006 專業細節 | 不變 | Current/Admin 保護、conflict、missing Base 不削弱 |
| travel-only 三個命令、不順帶全量 seed | core 保留不改 Users/member media/Home Config；現行命令查 package scripts、Playbook seed 小節／owning source guideline | 命令列表移出核心；語意不變 | 不以命令名獲得 Production read/write |
| 真實持久化需求才改 Collection、additive/nullable/backward-compatible | core 保留；schema history/types 仍需核對 | 不變 | 不因局部UI需求推測新增schema |
| Generate types、migration SQL/up/down 人工審查、rehearsal、approval/apply/read-back | core 保留順序；Playbook §9.2 保留 negative/drift rehearsal、observation、record/relationship read-back | 不變 | 無人類審查、未知結果或欠缺批准不能 apply |
| Production scope/dry-run/before/after/rollback，inventory須獨立read | core + Playbook §9.3–§9.4 | 不變 | 準備文件不要求先碰Production |
| Public/Family collection/data enforcement，secret禁入輸出 | core 明列；架構 §6／ADR-0002 | 不變 | UI隱藏不足；secret範圍不缩小 |
| Source/data目录與generated-type派生、禁any/第二份schema | core 保留常見邊界；詳細目錄仍由架構 §4.1–§4.3 擁有 | 不變／去重 | 不搬成新domain真相；查證改成按需 |
| CLI warning、destructive risk、漂移、conflict、timeout、UNKNOWN、privacy leak 停止 | core 保留全部類別及保留證據、不retry/repair、不自行判成功/失敗 | 不變 | fail-closed 不因速度目標而省略 |
| Minimal UI invariants 全部，P04不得先刪舊owner | core 保留Tailwind/shadcn、inline style例外、loading/error、ImageFallback、optional、R2禁Blob | 不變；刪除候選版本說明 | 本輪不移轉UI owner，沒有P04依賴或暫時缺口 |
| Skills metadata優先，主設計Skill、conditional references、defaults不得越權 | core 保留scope/stack/activation；index metadata與按需references；既有Skill scope正文原樣保留 | 縮寫；取消「通常一個」數量偏好 | 不強制疊Skill、不產生新批准或依賴安裝權限 |
| 所有實作必讀完整PB10/11 | 閱讀義務取消；core保留adequate evidence；PB10適用規範仍有效 | 刻意改為自主選擇／必要查證 | 不能把「自主」當成免測、免access測試或降低acceptance |
| Build後tsc、不並行、types、diff/secret、不臨時裝Prettier | core 保留；命令與完整適用性仍由PB10擁有 | 不變／去重 | 不把純文件分類套在runtime/config/schema變更 |
| Browser unavailable fallback／缺口／blocker、build/READY非完成 | core 保留；PB10/11保留細節 | 不變 | 缺 coverage 不能宣稱已通過；Preview/Prod批准獨立 |
| PR欄位、Phase狀態、中文報告目錄及完整模板、Closes條件 | core保留Closes gate；細節只在正式PR/Phase closeout查PB2/11–14/模板 | 移轉，不變 | 一般局部工作不生成完整Phase報告；正式closeout不降規 |
| CONTEXT/架構/ADR/preparation/artifact/report 各自owner | precedence及index保留owner；PB/架構原文保留，core不重述每個資料夾 | 不變／去重 | 準備不等於完成、有效spec仍有效 |
| 歷史不作authority，不改歷史/memory | core保留，後續狀態用addendum；index只按需查證 | 不變 | 不藉新候選修訂歷史批准或移除失敗證據 |
| #105 runner/manifest/ledger/receipt/boundedIO/invalidation/Preview contract | core逐項保留owner，不複製或假定已完成 | 不變 | 本案只做#113離線測試工具；Production能力不能被模擬證明 |

## 必須由 Human 接受的變更

接受模型按問題自行決定查證範圍，不再把「讀了哪些指定文件」當作完成條件。一般任務的書面 intake、逐 gate 格式、固定 ADR 聯集及完整驗證章節預讀義務被刻意移除；這不是「所有語意不變」。安全、權限、實際適用的測試與產品契約保留。

沒有新建架構owner，沒有修改CONTEXT/ADR/domain truth。舊architecture legacy retention與cleanup程式的落差仍保留為獨立問題；本次不裁定Production真相。
