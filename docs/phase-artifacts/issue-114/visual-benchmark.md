# Issue #114 — visual and context benchmark

日期：2026-09-24。基線 commit：`d72376dbd9f017d8b41f67d9915e58725b9c29fe`。本文件只記錄本地 repository 可查的證據；舊截圖不能當作今天的 runtime 讀回。#114 沒有變更 application UI，所以本次沒有同條件的 before／after 畫面可證明視覺品質提升。

## Representative surfaces

| Surface | Baseline artifact／來源 | 可觀察到的品質 | 本次後測／限制 |
| --- | --- | --- | --- |
| Ordinary Family portal／首頁 | 目前 source：`src/features/home/home-page.tsx`、`src/app/(app)/layout.tsx`；repository 未找到可追溯的首頁 screenshot | 有家徽、共同導覽、首頁層級與 Standard／Premium 區域；實際 crop、390px 換行、focus、鍵盤、contrast、空狀態仍 **UNKNOWN** | 未在本次以真實 browser 與相同資料擷取，故未評分，也不宣稱改善。 |
| Travel Memory Editorial | `output/playwright/phase21-editorial-day-mobile.png`；2026-08-31 本地 synthetic fixture、390×844 | 可見敘事標題、暖紙色、正文節奏、照片與 placement caption；當次報告記錄無水平溢位和 0 console errors。 | 舊畫面僅作歷史基線；本次未重拍，現況為 **UNKNOWN**。 |
| Travel Film／Cinematic | `output/playwright/phase21-cinematic-overview-desktop.png`；2026-08-31 本地 synthetic fixture、1440×1000 | 可見深色影像 hero、場次導覽和 day cards；fixture 重複照片不能用來評真實影像選擇。當次報告記錄無水平溢位和 0 console errors。 | 舊畫面僅作歷史基線；本次未重拍，現況為 **UNKNOWN**。 |

上述兩個 Travel 截圖的來源與限制見 [Phase 21 Browser QA](../phase-21/phase-21-browser-qa.md)。三種 surface 的同資料、同狀態、同 viewport 前後比較還未完成。之後驗收應先以純本地 fixture 建立 portal、Editorial、Cinematic 三組 baseline，記錄 commit／資料 hash／viewport／route，再對實際 UI 變更重拍。只在有明確 scope 的變更上比較，不為了 #114 自動全面改版或存取 Production。

| 後續最小 browser matrix | Desktop | Tablet | Mobile | 必須比較的狀態 |
| --- | --- | --- | --- | --- |
| Portal `/` | 1440×1000 | 768×1024 | 390×844 | 公開入口、主要導覽、focus、空資料與缺圖 |
| Editorial `/travel/:slug/day/:dayKey` | 1440×1000 | 768×1024 | 390×844 | 標題、章節、placement caption、前後導覽、缺媒體 |
| Cinematic `/travel/:slug` | 1440×1000 | 768×1024 | 390×844 | Hero、場次導覽、day cards、reduced motion、缺媒體 |

檢查每個受影響 viewport 的 `scrollWidth <= innerWidth`、console error、圖片請求與鍵盤導覽；對比和 reduced motion 需在相同內容／狀態下判定。這是可執行的驗收矩陣，不代表已執行。

## Quality rubric（每項 Pass／Fail／UNKNOWN）

1. 視覺層級：H1／H2、主行動、內容順序一眼可辨。
2. 一致性：共同字級、色彩、導覽與互動語法；presentation 差異有內容理由。
3. Responsive：desktop、tablet、390px；換行、留白、圖片 crop、水平溢位。
4. Interaction：navigation、loading／empty／error、hover／active／focus、鍵盤、觸控。
5. Accessibility：文字與圖片對比、alt 與可見 caption 分工、reduced motion。
6. Distinctiveness：只計可指出位置與替代理由的 generic pattern，不以視覺風格喜好充數。

本次僅依舊截圖對 Editorial／Cinematic 做非現行觀察，故沒有前後 score 或 generic-pattern count。Portal 的上述項目均未取得 browser 證據。這些 `UNKNOWN` 不能轉為 Pass。

## Context efficiency

計算方式：`wc -c` 的檔案 bytes 為可見 context 上限代理；不是 token telemetry，也不等於工具回傳的實際文字量。基線 `design-taste-frontend/SKILL.md` 2,023 bytes ＋舊單一深層 reference 86,935 bytes，若全讀為 88,958 bytes。#114 後入口 2,257 bytes；例如 interaction reference 2,366 bytes，該路線入口＋reference 為 4,623 bytes（約少 94.8%）。實際 task 仍需額外讀產品契約與受影響 code；不能把 94.8% 說成完整任務 token 節省。

| 任務樣本 | 改前可能載入 | 改後預期選用 | Tool calls／iteration rounds |
| --- | --- | --- | --- |
| 普通 button focus 修正 | 若誤選 Creative Skill，可讀到 88,958 bytes | 不選 Creative Skill；讀受影響 code、visual system 互動段與 `visual-qa` | 尚無真實任務對照，**UNKNOWN** |
| 新 Travel Editorial 版面 | 舊入口＋整份 reference：88,958 bytes | 新入口＋visual system＋typography／layout 的相關段落；完整相關檔上限約 36.9 KB | 尚無真實任務對照，**UNKNOWN** |
| 明確 Showcase | 多個重疊 Creative Skill 可能互相衝突 | 一位 Creative Director＋Showcase specialist 的相關技法＋visual system | 尚無真實任務對照，**UNKNOWN** |

## 驗收狀態與停止條件

- Skill 角色、precedence、tier、motion、reference routing 可由文件與 Skill 檔驗證。
- 「representative UI regression 證明整體一致性與品質提升」尚未完成：本次沒有 UI change 與可比對的前後 browser pair。不能用舊 Phase 20／21 的改善冒稱 #114 的改善。
- 後續若要以現有 portal／Travel 真實頁面作 QA，須依環境取得對應授權；不得為補 benchmark 讀取 Production 或修改 content／media。

## 2026-09-24 follow-up

使用者其後授權以純本地合成資料完成三種代表頁面的同條件前後比較及最小 UI 修正。[實測報告與全部截圖](./representative-ui-validation.md) 補足上述「尚未完成」的本地 browser 項目；本文件前段保留初次交付當時的狀態，不能再當作最新驗收結論。
