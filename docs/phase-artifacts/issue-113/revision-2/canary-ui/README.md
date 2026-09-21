# Revision 2 F-UI canary

結果：**INCONCLUSIVE — infrastructure startup failure**。日期：2026-09-20。

執行前固定 Astra/low、180 秒、20 個可觀測工具啟動事件、一次嘗試、不重試。詳細命令、CLI binary hash 與 prompt hash 見 plan.json；原始事件與 stderr 分別留檔。沒有即時 token 硬上限，工具事件上限也只涵蓋 CLI 暴露的事件。

本地無 remote 副本已準備，四份治理文字核對批准 hashes，保留 README dirty note 與 untracked personal-note。沒有複製本機未追蹤憑證或安裝 dependencies。沿用既有 F-UI prompt，未加入預期解法／評分答案。

唯一一次 CLI invocation 於 1.82 秒後 exit 1：state DB 為唯讀，in-process app-server client 初始化 Operation not permitted。未收到模型事件；0 個可觀測工具啟動，副本檔案零變更、空 staging、diff check PASS。沒有最終模型答案或 usage telemetry，不能把缺少 usage 說成零 token。

因此 context reads、Skill activation、重複讀取、批准行為、安全決策與完成品質全部未能評估；這不是模型 FAIL 或治理 regression。沒有啟動 F-DATA/F-SENSITIVE，沒有自動重試，沒有修改治理或進行 GitHub／Production 操作。

建議：先在下一個獲批准的環境準備工作中解決 CLI 啟動權限，再另行批准一次 canary。不得把放寬父程序權限當作已批准，也不得繞過 sandbox。保留本次為獨立失敗嘗試，不覆寫其證據。此結果不支持 token savings 或跨版本效能比較。
