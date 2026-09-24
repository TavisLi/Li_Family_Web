# Li Family visual system

狀態：#114 的產品視覺契約；適用於後續新增與明確要求的視覺調整。既有頁面保持目前行為，差異記入 QA，不因本文件自動改版。

## 決策順序與共同 DNA

目前使用者需求 → 本產品視覺契約 → repository 架構與實際 stack → task-specific Creative Skill → generic defaults。安全、access、資料與發布權限仍由 `AGENTS.md`／accepted ADR 管理。視覺契約不能修改 schema、framework、CSS framework、icon library 或外部環境。

Web Li 的共同特徵是清楚的繁體中文敘事、克制的藍／金／綠提示、可辨識的家徽、真實家庭影像與有次序的留白。讓主題來自內容與照片，不用無關的漸層、玻璃或動畫填滿空間。所有 presentation 都保留可見導覽、文字對比、鍵盤路徑與誠實的空狀態。

## 三層 visual effort

| Tier | 適用 | 設計投入與界線 |
| --- | --- | --- |
| Standard | 一般 Family portal、表單、設定、內容及輔助頁 | 乾淨、現代、克制；沿用現有組件及版面語法。 |
| Premium | 首頁、Travel Memory、重要家庭敘事 | 以版面、字級、照片節奏與恰當細節建立辨識度；仍保持直接可用。 |
| Showcase | 使用者明確指定的 cinematic hero、特殊旅行呈現、視覺實驗或展示面 | 可採更強的構圖及動效，但需明確故事目的和效能／可用性驗收；不擴散至普通 UI。 |

## Typography 與文字

- 現況：`src/app/globals.css` 的 body stack 為 `Inter, "Noto Sans TC", ui-sans-serif, system-ui, sans-serif`；`font-serif` 與 `font-mono` 用於敘事標題／編號。這是 CSS fallback 宣告，不等於字型檔已載入。新工作先沿用，換字體需另案。
- 一頁有明確 H1 → H2 → H3；常規內文字級以 `text-sm`／`text-base` 為基礎，長文保持舒適行高（約 1.6–1.8）與可讀行寬。Premium display 可用 `text-5xl` 到 `md:text-8xl`，以內容及 viewport 調整；普通 UI 不套用展示字級。
- 繁體中文不強行全大寫或大幅 letter spacing；英文小標可以使用 tracking，但不能犧牲中英混排與數字辨讀。標題檢查 390px 換行、孤字、英文單字和日期斷行；數值序列用 tabular numerals 時須有資料比較理由。
- 明確區分內容標題、輔助說明、metadata 與 CTA。不可只靠顏色表達層級或狀態。

## Color、surface、spacing

- 全站語意色以 `src/app/globals.css` 的 `--background`、`--foreground`、`--card`、`--primary`、`--secondary`、`--accent`、`--muted`、`--destructive`、`--border`、`--ring` 與 dark variants 為實際來源；不要在文件複製第二份可執行 token。新組件用這些語意色，presentation-local 色值只服務特定旅程語氣。
- Standard 表面以背景、卡片、邊界與留白分層；陰影只在浮起或可操作的層級有意義時使用。既有 shadcn radius 基準為 `--radius: 0.5rem`，sm／md／lg 由 `tailwind.config.ts` 派生。敘事影像可以使用不同邊角，但同一組件家族要一致。
- Elevation 分為 flat（內容與分隔）、raised（可點擊卡片，通常 `shadow-sm` 或輕微色差）、overlay／hero（只有實際疊放時使用較深陰影）。不為每張卡加邊框又加重陰影；同一頁維持一致的光線方向。
- 間距優先採 Tailwind 既有 4px 倍數語法；常用間隔 8／12／16／24／32／48／64px。頁內節奏可變，不能每一段都強制相同巨大留白。用內容密度決定 whitespace。
- Standard 共用容器以現有 `max-w-7xl` 導覽／首頁為參考；閱讀欄維持較窄。Travel presentation 可用全幅 hero，正文與導覽仍要有明確最大寬度。不要讓文字在大螢幕無限伸展。
- 導覽／大區塊上限約 `max-w-7xl`；長文優先 `max-w-2xl`／`max-w-3xl`，或沿用 owning renderer 的閱讀寬度。兩者是不同內容密度，不要互相套用。

## Components、影像與導覽

- Button 先沿用 `src/components/ui/button.tsx` 的 variants、disabled 與 focus；卡片先看所屬頁的現有形態，不為一致而把所有敘事變成相同白卡。Navigation 要能辨識當前位置，滑鼠、觸控與鍵盤都能到達主要目的地。
- 功能圖示沿用已安裝的 `lucide-react`；同一控制群使用一致的 16／20／24px 級距與 stroke。圖示不能獨自承載動作名稱或狀態，裝飾性圖示標為隱藏，必要圖示提供可讀名稱。
- 使用真實、授權的家庭媒體和既有 `PayloadImage`／`ImageFallback`。`altText` 是圖片可及性描述；可見 `caption` 來自 placement，不互相代替。選擇 crop 時保留人物／場景重點；檢查 desktop 與 390px，缺圖誠實顯示 fallback 而非當作內容完成。
- Hero 先確定一個主焦點、可讀標題、必要的導覽／CTA，再決定圖片佔比及遮罩。對比要在實際影像上成立。Cards、sections、nav 沿用共同字級與互動訊號，敘事表面可有自己的構圖。

## Presentation families

| Family | 共用規則下的允許變化 | 現有程式參考 |
| --- | --- | --- |
| Family portal／ordinary UI | Standard；快速辨讀、直接操作、少量語意色與簡潔卡片。首頁的重要敘事區可用 Premium。 | `src/features/home/home-page.tsx`、`src/app/(app)/layout.tsx` |
| Editorial／Travel Journal | Premium；暖紙色、襯線大標、較窄正文、非對稱章節與編輯式圖片說明。 | `src/features/travel/travel-memory-pages.tsx` 的 `editorial-journal` |
| Cinematic／Travel Film | Premium；深色影像畫布、場次／日期節奏、接觸表與較強空間感。只有明確指定 Showcase 時增加電影式動效。 | 同檔的 `cinematic-timeline` |
| Family Scrapbook | Premium；紙張感、相簿拼貼、手記式 caption；保持觸控區域及閱讀順序。 | 同檔的 `family-scrapbook` |

不同旅程可透過既有 presentation style 變化，不另造第二套產品系統。不要把 Film 的深色／動效或 Scrapbook 的旋轉照片套到普通表單。

## Motion 與狀態

| Tier | 用途 | 建議尺度 |
| --- | --- | --- |
| Subtle（預設） | focus、hover、pressed、選取與簡單狀態切換 | 即時到約 200ms；不延遲內容。 |
| Expressive | 章節切換、重要敘事導覽與空間方向 | 約 200–450ms；只動畫必要元素，可中斷。 |
| Cinematic | 明確指定的 Showcase 敘事表面 | 逐案設計與量測；不能阻塞閱讀或導航。 |

使用最低足夠 tier。尊重 `prefers-reduced-motion`：減少非必要變形、視差、循環與轉場，內容及操作在無動畫時仍完整。禁止 scroll hijack、每個元素都動、冗長 intro、行動裝置大面積 GPU 負載。只有層級、導航、狀態或故事目的能支持 motion。

Subtle 的進場預設 `ease-out`、可逆狀態預設 `ease-in-out`；Expressive 可依敘事選用現有 cubic-bezier，但同一互動家族保持一致。Pressed 要即時回饋，不能等待入場動畫。Cinematic duration／easing 逐案記錄並實測；不把 700ms 以上的轉場當普通按鈕預設。

在相同產品語氣下設計 loading、empty、error：loading 保留結構及預期尺寸；empty 說明目前缺少什麼和可用的下一步；error 指出可恢復動作。所有狀態保留可見 focus、可操作鍵盤路徑、足夠對比與至少舒適的觸控目標。Family 私密內容的 access 仍由 data／collection 層強制。

Mobile 不依賴 hover 才能找到功能；主要 CTA 與導覽要在手指可及範圍，觸控區域不互相重疊。Sticky header 不遮住錨點或 focus 目標；展示版面在窄螢幕回到清晰閱讀順序。

## Responsive acceptance

先看受影響的 390px mobile，再檢查 tablet 與 desktop；適用 viewport 依變更風險決定。文字不裁切、導覽可達、圖片不錯裁、沒有非預期水平溢位，hover 專屬資訊在觸控上有替代。依 [visual-qa Skill](../../.agents/skills/visual-qa/SKILL.md) 留證據；本契約本身不代表任何頁面已通過 QA。
