# #113 Slice 1：Codex governance audit 與待審提案

狀態：**AUDIT COMPLETE / PROPOSAL ONLY / HUMAN REVIEW REQUIRED**。本資料夾都是稽核產物，不是新的生效治理文件。沒有套用 patch、切換 branch、commit、push、修改 Issue、部署、讀取 Production 私密資料、mutation、cleanup、merge 或 release。

## 1. Scope 與固定基線

- Issue：[Astra-ready Agent Governance 與 Context Loading 優化 #113](https://github.com/TavisLi/Li_Family_Web/issues/113)，本輪唯讀快照見 `issue-113.json`。只完成 Delivery Slice 1，不宣稱整個 Issue acceptance 完成。
- Phase 21 closeout 固定比較基線：`f1796687d2469319c4a465feada1ffc3cb8b59d8`（PR #122）。
- 2026-09-14 實際 audit HEAD：`e20bf82f489634112a2c569b5ce5e0ba06616b81`。本地 `main`、`origin/main` 與 GitHub REST 讀回的 `main` SHA 一致；開始時工作樹乾淨。
- 中間已合併 PR #124 Node 24 migration。指定治理 surfaces 的差異是 AGENTS 與 Playbook 的 Node 20.20.2 → 24.21.0；架構契約亦更新。保留歷史基線，不用它還原現在的版本。
- PR #127「docs: record #119 Production verification」讀取時 OPEN，見 `pr-127-state.json`；不把其標題當成已驗證 Production 的證據。Preview／Production 本輪 **NOT INSPECTED**：與 instruction audit 無必要相依，也沒有取得 Production access authority。
- #105 仍 OPEN，擁有 runner／manifest／ledger／receipt／bounded I/O／approval invalidation／Preview QA execution contract。本提案只引用與路由，不建立第二套 executor。

驗收：盤點每個指定 surface；區分 runtime discovery 與讀取；列出具體衝突與 disposition；留下可重算成本 baseline、九種 task routing、具體 patch allowlist、驗證計畫與未確認項目。停止條件：任何治理 apply、外部 write、Production 或 destructive 動作都超出 Slice 1。

## 2. 真實載入面與證據強度

`inventory.json` 有 226 筆 surface（含 173 個本次可見 Skill entries、10 個 Claude aliases、文件與 runtime／historical 分組），每筆記錄 source、owner、purpose、runtime、loading mode、status、precedence、bytes、duplicates、conflicts、disposition。可讀檔附 SHA-256；repository 檔案另附 Phase 21 基線 bytes/hash（當時存在才有）。不是聲稱全機器只有這些檔案。

| Surface | 判定 | 證據／邊界 |
| --- | --- | --- |
| `~/.codex/AGENTS.md` | ACTIVE，always | 2,226 bytes；內容確實出現在本次合併的 user instruction block 前半部 |
| repository `AGENTS.md` | ACTIVE，always | 8,413 bytes；同一 instruction block 後半部完整可見 |
| global/root `AGENTS.override.md` | INACTIVE，absent | 兩者不存在；未發現 selected root instruction 被 override 替換 |
| `CONTEXT.md`、architecture、ADR、Playbook | CONDITIONAL | 檔名不自動載入；AGENTS 要求後由工具讀取。本次 audit 已讀相關內容 |
| `.codex/config.toml` | ACTIVE config | 設 personality 及 frontend-design enable；不是直接把 TOML 当作模型指令正文 |
| global config | ACTIVE config | project trusted；15 個 plugin enable entries。只讀 allowlist 設定，未輸出 credentials |
| `.agents/skills/*/SKILL.md` | catalog ACTIVE / body CONDITIONAL | 全部 10 個路徑出現在本次 Skills catalog；metadata 可見不代表正文已進 context |
| `.claude/CLAUDE.md` | Codex INACTIVE | Codex selected chain 無此檔，未設相應 fallback；本次為 audit 手動讀取。Claude 實際啟動未測試 |
| `.claude/skills/*` | Codex separate discovery INACTIVE | 10 個 symlink 均解析至 `.agents/skills/*`。同源 alias，不是 270 KB 的第二份內容 |
| migrate-to-codex report | INACTIVE historical receipt | `inactive: skills - none found` 與現況不同；不覆寫舊 migration receipt，只停止當成 live inventory |
| plugin Skills／tools | metadata/tool surface ACTIVE，body CONDITIONAL | catalog 與 `tool-surfaces.json` 是本次直接證據；無須實際呼叫外部服務證明工具列存在 |
| global「任何不清楚就停止」規則 | SHADOWED rule | 與本次更高優先 host autonomy 衝突的部分不生效；整份 global AGENTS 仍 ACTIVE |
| duplicates／cache-only／未驗證 runtime | UNKNOWN | 不能因同名推斷 shadow，也不能因 config enabled 推斷 MCP authenticated |

官方載入規則：global 優先選 override 再 AGENTS；project root 到 cwd 每層選一份，較深層後合併；預設 instruction file 上限 32 KiB。本機兩份合計 10,639 bytes，未見相關 override／自訂上限鍵，本次注入也未缺失。這是 filename discovery，不是任意 Markdown 依文字宣称的優先級。[OpenAI AGENTS 文件](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

Skills 使用 progressive disclosure：本次 catalog 實測有 name／縮短 description／path；正文依選用讀取。官方也區分初始目錄預算與完整 Skill 正文；不能把所有 body bytes 算成 startup。[OpenAI Skills 文件](https://learn.chatgpt.com/docs/build-skills)

Plugins 能帶入 Skills／MCP／hooks，配置、可見工具、認證成功與動作授權是不同事實；本輪未安裝或卸載 plugin。[OpenAI Plugins 文件](https://learn.chatgpt.com/docs/plugins)

Global 與 repo 都 enable frontend-design：確定它可見，但不能隔離是哪一處 enable 導致。`vercel:*` 與 `vercel-plugin:*` 多個版本路徑同時出現在 catalog，不能標成某一個已被 shadow。superpowers／chrome／browser／computer-use config entries 沒有足夠一對一曝光證據，保留 UNKNOWN — VERIFY FIRST；不 disable。上述未知不阻礙 repo-local routing 提案，但阻止刪除／關閉相關 surface。

## 3. Conflict register

以下 Skill 文字作為稽核資料，不是本輪啟用的設計指令。先讀 metadata/headings，再檢查衝突段落；沒有為盤點全讀無關 plugin 正文。`inventory.json` 的 Fxx 對應本表。

| ID／類型 | Path、規則／定位 | 實際影響與 disposition |
| --- | --- | --- |
| F01 conflicting | `~/.codex/AGENTS.md` §1：`If something is unclear, stop. Name what's confusing. Ask.` | 非關鍵歧義也可被解讀成 mandatory stop。P01 明示合理假設＋繼續獨立工作，限定 consequential missing info 才詢問。KEEP global，不跨 repo 改設定 |
| F02 overbroad/redundant | `AGENTS.md` §3、Playbook §5、`.claude/CLAUDE.md` ordered reads | substantive work 全量 context，還要求 deployment／Production 狀態，與獨立 access gate 張力。ROUTE：startup 最小化；live inspection 需相關且已授權 |
| F03 overlap | `AGENTS.md` §2／§5-§8；architecture §3-§6／§10；ADR-0001/2/4/6 | runtime version、layout、data source、privacy、reconciliation 被多處重述；不能盲刪唯一規則。CONSOLIDATE：先搬 AGENTS 獨有 UI invariants 到 architecture，再改成強制路由 |
| F04 redundant | AGENTS §7／§9-§11；architecture §10-§12；Playbook §9-§14 | schema／validation／report/lifecycle 多份可能漂移。CONSOLIDATE：Playbook 擁有程序，architecture 擁有 invariant，AGENTS 保留短安全門與引用 |
| F05 ambiguous | AGENTS §1 沒有列 Skill，domain/Phase/history 混同一層；AGENTS／CONTEXT `Implemented` vs Playbook §2 `Implementing` | 難判断 generic Skill 可否 override；執行中／已實作語意混淆。P01 分層；P03 補狀態對應，不改寫歷史 |
| F06 obsolete receipt | `.codex/migrate-to-codex-report.txt` skills none found；historical reports 的當時狀態 | 舊掃描不是現在的 loader／release state。KEEP receipt，ROUTE 歷史只做必要驗證；不修改歷史內容 |
| F07 costly/ambiguous | `design-taste-frontend/SKILL.md` 87,253 bytes；§0.C、§14、Appendices | heading 的「ask one」比正文嚴；正文實際有 infer confidently then don't ask，**不是無條件確認缺陷**。SHORTEN entry，技術全文移 reference；保留這個例外，不以標題斷章取義 |
| F08 stack/assets conflict risk | high-end §2 假設 premium fonts 可用、禁 Lucide；minimalist §6 指 Phosphor/Radix；redesign Typography/Icon rules；design-taste §3 | repo 現用 Tailwind 3.4.17、lucide-react；沒有因 Skill 添加 icon／motion 的必要性。design-taste **已有 v3／Lucide existing-project 例外**，但 missing glyph → install second library 與 one family 張力。ROUTE／限定 defaults，不能強制換字型或新增依賴 |
| F09 mutually exclusive techniques | high-end §4 pill/nested enclosures／§5 全體入場動畫；minimalist §2／§5 平面／有限 radius；industrial §4 全直角；frontend-design plugin Motion 段落 | 同時啟用會互斥；plugin 主張克制 motion，high-end 主張普遍 reveal。ROUTE：一次選主方向，按任務選技術，不刪風格 Skill |
| F10 scope/output inflation | image-to-code description/mandatory image-first；imagegen-web 每 section 一張；design-taste dark mode/preflight；redesign broad audit/font swap | routine UI fix 可被擴張成產圖、雙模式改造或重設計。P06/P07 精確縮小 description 與 scope，mandatory ritual 只綁其 deliverable |
| F11 ownership/runtime ambiguity | global 與 repo config 都啟用 frontend-design；Vercel 兩個 plugin family 可見 | 未證實 duplicate body injection，不可用刪 plugin 宣稱節省。KEEP config/cache，未隔離 provenance 保留 UNKNOWN |
| F12 authority ambiguity | stitch-design-taste §Overview 的 generated DESIGN.md `single source of truth`；image-to-code generated image primary visual source | 限定為 Stitch/design artifact 的視覺 reference，不得覆寫 repo architecture。ROUTE＋scope header；其 DESIGN.md 是 example/reference |
| F13 scope hazard, not flawed ADR | accepted ADR-0008 no-backup waiver | 正文明示只適用 Phase 17 一次，不是未來 cleanup 許可。KEEP，不將它簡化成通用例外；納入 regression |
| F14 stale external guidance | memory `li-family-web-phase-workflow/SKILL.md` pitfalls Node 20、固定廣泛 Production metadata audit；MEMORY 仍有 Node20 plan | current repo 已 Node24。DEPRECATE 作為 live runtime指令；只作歷史線索。記錄建議但不修改 memory（需使用者明確要求） |
| F15 temporal domain wording | `CONTEXT.md` Legacy TravelProject：`legacy records 與關聯目前只作 rollback evidence`；architecture §8.4 Phase17 過渡狀態 | 可能與後來 cleanup evidence 不一致；非本輪 live inventory 證明。UNKNOWN — VERIFY FIRST，單獨 owning-domain review，不藉精簡更改 domain truth |

設計 Skill 明細：brandkit 15,992；design-taste 87,253；high-end 10,561；image-to-code 36,442；mobile imagegen 40,326；web imagegen 36,854；industrial 8,456；minimalist 7,901；redesign 15,060；Stitch 11,851 bytes。共 270,696 bytes，**這是磁碟正文總量，不是已注入 context**。技術差異有價值，全部保留，不因相似名稱刪除。

## 4. 目標治理架構與 precedence

平台 system/developer hierarchy 是外層硬限制，repository 文件不能升格覆寫。repo 內：

1. 使用者目前 task 與仍有效的 scope／批准。
2. canonical product vocabulary、accepted ADR／architecture／privacy decisions。
3. AGENTS：authority、autonomy、minimal startup、安全 stop boundary。
4. owning domain rules、Phase Playbook。
5. task-specific Skills（不授予權限、不替換 stack、不重复批准）。
6. historical prompts／reports／examples（證據而非現在的命令）。

唯一 owner：CONTEXT 擁有 vocabulary；ADR＋architecture 擁有持久決策／invariants；AGENTS 擁有代理行為；Playbook 擁有 lifecycle/HITL/validation/report；Skills 擁有特定技術；current-state/ledger 擁有本次 execution state；completion/artifacts 擁有歷史事實。新 `docs/agent-context-routing.md` 只擁有讀取索引，不另寫 gate。

候選完整文字見 `draft-core.txt`、`draft-routing.txt`。涵蓋 documentation、UI、ordinary code、domain projection、schema、seed/media、Production read-only、Production mutation、release/closeout 九路由。跨域取聯集，任何 safety/correctness/acceptance 必需 context 不可省略。

Autonomy 的判定是「已有 authority、低風險、可逆且證據充分」才能合理假設前進；可 rollback 單獨不是 approval。重大產品取捨、privacy、scope 超出、Production／destructive／merge gate、drift、UNKNOWN commit state 仍停。已批准操作不重問；scope／環境／baseline 改變必須重判，細節指向 #105，不複製 token／receipt 邏輯。

### Precedence 檢查（本輪静態判讀，非模型 A/B 執行測試）

| Case | 有衝突的兩端 | 本輪判讀／Slice 2-3 expected |
| --- | --- | --- |
| T01 audit-only vs Skill says edit/refactor | 本次 user vs generic workflow | PASS：只產 audit artifacts，沒有改治理 |
| T02 uncertain button spacing vs ask-anything | repo seam/task vs global §1 | 繼續合理假設；不能因此提升到新設計決策 |
| T03 Skill wants icon package vs existing UI | architecture/task vs technique | 沿現有庫；必要新依賴才提出具體理由，不默默 install |
| T04 cleanup vs accepted ADR0008 | new task vs historical scope | 不泛化 waiver；新 cleanup 仍需備份／獨立 authority |
| T05 supplied valid approval vs generic reconfirm | existing user authority vs Skill | 不重問；drift／scope 變更則停 affected action |
| T06 no Production access vs preflight read | user scope/AGENTS H4 vs full-read list | 不讀 Production；繼續本地準備，缺口清楚列出 |
| T07 read-back failure/unknown commit | completion request vs safety gate | BLOCK affected mutation；不 retry／假稱成功，繼續獨立文件工作 |
| T08 private data hidden only in UI | architecture/ADR0002 vs rendering convenience | 拒絕只在 UI 過濾；data/collection enforcement 保留 |
| T09 historical Node20 vs live selectors | memory vs repo source | 採目前 repo Node24；不修改凍結歷史證據 |
| T10 audit files vs active governance | proposal content vs filename discovery | drafts 留在 artifact `.txt`，沒有建立 active routing/AGENTS |

T02–T09 是已定義的預期與文義核對，不宣稱另啟模型驗證。Slice 2 加 offline structural regression；Slice 3 才跑三個 representative tasks 的真實行為比較。

## 5. Context-cost baseline

取樣來自本次 local session JSONL，只保存位元組統計，不複製 host instructions、secrets 或整個對話。無可靠 token／billing telemetry，不報 token 數。

- user/developer visible messages 序列共 63,187 UTF-8 bytes（snapshot）；包含 task、repo instructions、catalog 等，不能與下列子集合重複相加。
- Skills catalog 區塊 20,690 bytes，173 entries；entries 合計 20,516 bytes，差額為分隔／格式。明顯存在截短 descriptions。
- base instructions 欄位 JSON serialization 21,565 bytes：包含序列化開銷，**不是精確 model-visible payload**；不與可見訊息合併成假的總 context。
- root＋global AGENTS 檔案 10,639 bytes；檔案總數／Skill body 容量與本次 runtime injection 分開計量。

三個固定 fixtures 是現行 policy 所要求讀取的**靜態集合**。`measure-context.py` 以 Git 歷史與 current files 重算，`benchmark-fixtures.json` 列出檔名、候選 owning sections、gates、排除項。兩邊同樣排除 code/test/task/Issue/evidence 與固定 host overhead，不藉省略實作／驗證降低數字。

| Fixture | Phase21 baseline bytes | Current baseline bytes/files | Candidate bytes/files | 靜態估算下降 |
| --- | ---: | ---: | ---: | ---: |
| F-UI existing-pattern spacing fix | 33,993 | 34,023 / 6 | 14,258 / 5 | 58.1% |
| F-DATA Travel caption projection | 56,658 | 56,688 / 11 | 46,574 / 11 | 17.8% |
| F-SENSITIVE cleanup preparation | 61,832 | 61,862 / 11 | 29,154 / 10 | 52.9% |

候選數字不是已完成的改善：使用 draft core/routing＋現行必要 sections；尚未計入 owner 移轉後的確切長度。普通 UI fixture 不強行加入任何 Skill 正文，所以沒有用「現況全部 Skill 都會載入」膨脹 baseline。data 降幅較小因保留 glossary、ADR、source guideline；這是合理取捨。檔案數未必下降，按 section 讀取仍可減 bytes；不要為了檔案數刪安全 owner。

`tool calls`、`repeated reads`、`clarification rounds`、`duplicate approval rounds`、`completion/blocker quality` 的 representative-run 實測都為 **NOT RUN/null**，不可當作零。本輪 audit 的工具成本不能當 routine task before。Slice 3 應用相同三 task、固定 input/approval/model、新任務隔離 context，保存每次實際返回 bytes、calls、重讀（相同 hash＋範圍）、approval reason 與 completion evidence；比對 gate 不退化後再談效率。安全測試失敗，即使 bytes 降低也不通過。

## 6. Exact patch set 與審查邊界

`patch-set.json` 是待批准的檔案 allowlist、operation、heading anchor、替換 description／scope block、reference relocation 與 regression spec。P01/P02 提供完整候選文字，不必根據摘要猜修改範圍。

- P01 AGENTS：縮為 operating core；global hard-stop 在 repo 明確具体化，不動 global 檔。
- P02 新增 context routing：九路由與 on-demand Skill／history 選擇。
- P03 Playbook：路由 preflight、明確有效 approval reuse、統一 lifecycle 名詞、依改動驗證、去除 architecture 重複。
- P04 architecture：先承接 AGENTS 獨有 UI invariants，再把 Phase 程序引用回 Playbook；不改 domain/schema/ADR。
- P05 Claude entry：只指向 root operating contract＋routing，保留單一 shared owner。
- P06 design-taste：原技術正文完整移入自身 references；短 entry 依章節選取。不是刪除設計能力。
- P07 其他九 Skills：精確窄化 descriptions，加 task scope／priority header，保留 technique body。Claude aliases 跟同源，不另修改。
- P08 offline structural regression；P09 批准後驗證 receipt。真正 model-run benchmark 留 Slice 3。

套用前重新比對 `baseline-hashes.json`、HEAD 與新進 main 變更（含 PR #127）；drift 時更新對应提案而非覆蓋。此 audit branch 沒有建立或切換；只是 main 上新增 artifact 目錄，後續實作才建 `codex/*` 分支。

不改：CONTEXT、accepted ADR、global config/AGENTS、memory、plugin cache/config、Claude symlinks、歷史 report/migration receipt、dependencies、#105 executor。F15 留作 owner review。沒有 plugin uninstall 或未知 surface deletion。

### Safety-preservation review map

| 現行 invariant | 目標 owner／必讀路由 |
| --- | --- |
| Production read/write/schema/content/destructive/GitHub/merge separate authority | AGENTS core＋Playbook §4 H1-H10；Production／release routing |
| dry-run/rehearsal/rollback/read-back／data-loss warning | core stop clause＋Playbook §9；schema/seed/mutation routing |
| Base/Source/Current、Missing Base preserve-current | architecture §5＋ADR0006；domain/seed routing |
| travel-only seeds、不混入 Users/Home/member media | Playbook §8.3 seed-managed section；seed routing |
| generated Payload types / src/lib/data / no any | architecture §4；code/domain routing |
| Family access enforcement / privacy / secret / R2 | architecture §5-§6＋ADR0002/0004；UI/data/media routing |
| inline-style prohibition / ImageFallback / existing stack | P04 承接後的 architecture UI section；在移轉前不能從原 AGENTS 刪除 |
| build then tsc / no temporary Prettier / exact verification state | Playbook §10＋AGENTS；依 change scope |
| preserve dirty assets / no implicit cleanup | AGENTS always core |
| historical waiver not reusable / evidence not current truth | accepted ADR0008＋core precedence；sensitive routing |

## 7. Verification 與限制

已驗證：Issue 原文、remote/main SHA、local clean starting state、各檔 bytes/hash、10 alias realpaths、可見 Skills catalog、可見 tools、三個可重算 baseline。JSON/schema/disposition/reference 檢查及治理檔 unchanged 驗證記錄在 `verification.json`。

沒有執行 build、tsc、application test、Production request 或模型對照測試：本轮是文件稽核，這些不證明 loader 盤點，且後三者不在 scope。未知的 plugin source resolution、CLI/Claude 新 session 行為、managed config 對所有其他 host 的覆寫、真實 token 與未來 completion quality 均未假裝已確認。

**停止供人工審查。** 本輪的停止來自使用者「Do not modify governance yet. Stop for human review.」及 #113 Slice 1，不是 Skill 新增的確認 gate。批准對象是 P01–P09 的 repo-local governance proposal；任何 global/plugin/memory 修改、Production、merge/release 仍未包含。
