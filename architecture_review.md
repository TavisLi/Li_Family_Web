# Web Li — 架構深度評估與改進建議

> **評估範圍**：`architecture.md`、`README.md`、`Web  Li Prompt.txt`
> **評估目標**：現有設計的問題點 + 面向未來迭代的架構優化建議

---

## 一、總體評估

現有草稿的技術選型方向整體**合理且現代**（Next.js App Router + Payload CMS v3 是 2025 年的優秀組合），
但在以下 5 個維度存在**明確的設計隱患**，若不在開工前解決，未來的迭代成本會指數級增長：

| 評估維度 | 現況評分 | 核心問題 |
| :--- | :---: | :--- |
| **技術棧選型** | ✅ 良好 | 個別選型需調整 |
| **資料庫與資料模型** | ⚠️ 待改進 | 媒體模型設計過於簡化 |
| **媒體儲存策略** | ❌ 高風險 | Vercel Blob 有嚴重限制 |
| **部署與成本控制** | ⚠️ 待改進 | 鎖定 Vercel 生態，成本不可預期 |
| **可擴展性 (未來迭代)** | ⚠️ 待改進 | 缺少 SEO / 效能層設計 |

---

## 二、問題分析與具體改進建議

### 問題 1：媒體儲存策略 — Vercel Blob 是錯誤的選擇 ❌

**這是整個架構中風險最高的決策。**

**問題根源：**
家庭相冊、旅遊影片是這個網站的核心資產。您的需求文件中提到「高性能瀑布流照片/影片牆」，意味著將有大量的媒體檔案長期累積。Vercel Blob 的問題如下：

- 儲存費用：$0.023/GB/月（每 TB 約 $23/月）
- 讀取頻寬費用：$0.05/GB（**對面向公眾的家庭相冊，頻寬是最大殺手**）
- 影片串流：Vercel Blob **不支援範圍請求 (Range Request)**，無法做原生的影片分段串流，使用者體驗極差。

**改進建議：採用 Cloudflare R2 替代 Vercel Blob**

```
Cloudflare R2 vs Vercel Blob 成本比較（以 100GB 儲存 + 月流量 50GB 為例）：

Vercel Blob:  $2.30（儲存）+ $2.50（讀取）= $4.80/月
Cloudflare R2: $1.50（儲存）+ $0.00（讀取）= $1.50/月  ← 讀取流量永久免費！
```

Payload CMS v3 支援自定義儲存適配器，接入 Cloudflare R2（S3 兼容 API）幾乎零成本，且：
- ✅ 讀取頻寬完全免費（Global CDN）
- ✅ 支援範圍請求（影片串流流暢）
- ✅ 可直接開啟 Cloudflare Transform（圖片自動壓縮、格式轉換 WebP/AVIF）

> **行動指令**：在 `architecture.md` 中，將 `Vercel Blob` 替換為 `Cloudflare R2 (via S3-compatible adapter)`，並在環境變數區塊新增 `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`。

---

### 問題 2：資料庫選型 — Vercel Postgres (Neon) 的隱藏成本 ⚠️

**問題根源：**
Vercel Postgres 底層是 Neon serverless PostgreSQL。Serverless 資料庫的冷啟動（Cold Start）延遲對 CMS 後台的使用體驗傷害極大（管理員保存一筆資料可能要等 2~4 秒）。更重要的是，Vercel Postgres 的免費方案**僅 256MB 儲存**，超出後費用高昂。

**改進建議：採用 Supabase PostgreSQL 或直接 Neon 獨立賬戶**

Payload CMS 的 `@payloadcms/db-postgres` 適配器接受**任何標準 PostgreSQL 連接字串**，因此可以靈活替換：

| 方案 | 免費方案 | 生產優勢 | 推薦度 |
| :--- | :---: | :--- | :---: |
| **Supabase** | 500MB + 2 projects | 含即時訂閱、Storage、Auth（備用）| ⭐⭐⭐⭐⭐ |
| **Neon 獨立賬戶** | 0.5GB | 自動分支（Branching），與 Vercel Postgres 同底層但更便宜 | ⭐⭐⭐⭐ |
| **Vercel Postgres（現況）** | 256MB | 整合 Vercel Dashboard 方便 | ⭐⭐ |

**首選推薦**：**Supabase**。除了資料庫本身，Supabase Storage 可作為 Cloudflare R2 的備選，且其慷慨的免費額度非常適合家庭項目。

> **行動指令**：將 `DATABASE_URI` 指向 Supabase 或 Neon 獨立賬戶的連接池 URL（`pgbouncer` 模式），避免 Serverless 冷啟動問題。

---

### 問題 3：媒體資料模型過於扁平 — `TravelMedia` 與 `GlobalMedia` 需要重新設計 ⚠️

**問題根源：**
目前草稿中，媒體被拆為 `TravelMedia`（旅遊媒體）和 `GlobalMedia`（全站媒體）兩個獨立集合。這個設計在未來會造成以下問題：
- 同一張照片（如家庭合照）同時想出現在「成員頁」和「旅遊相冊」，需要重複上傳
- 媒體庫無法統一瀏覽、搜索
- 後台管理員體驗割裂

**改進建議：統一媒體庫 + 標籤/關聯設計**

```
舊設計（扁平）：         新設計（統一媒體庫）：
TravelMedia              ┌─────────────────────────┐
GlobalMedia       →      │  Media (統一媒體庫)       │
                         │  - type: 'photo'/'video'  │
                         │  - tags: string[]         │
                         │  - altText (localized)    │
                         │  - relatedMembers: Member[] │
                         │  - relatedTravel: TravelProject? │
                         └─────────────────────────┘
```

單一的 `Media` 集合，透過 `type`（photo/video）、`tags`（標籤）和關聯欄位靈活分類，管理員只需上傳一次，即可在多處引用。這也是 Payload CMS 官方推薦的最佳實踐。

---

### 問題 4：目錄結構缺少關鍵層次 — `features/` 與 `types/` ⚠️

**問題根源：**
目前的目錄結構缺少兩個隨著項目擴大必然需要的目錄：

```diff
- components/
-   ui/
-   layout/
-   interactive/
-   home/

+ components/         ← 保持純粹的"通用組件"
+   ui/
+   layout/
+   icons/
+
+ features/           ← 【新增】按功能域組織的業務組件
+   member/           # 成員頁相關
+   timeline/         # 時間軸相關
+   travel/           # 旅遊詳情相關
+   home/             # 首頁相關
+   admin/            # 後台專用組件
+
+ types/              ← 【新增】集中管理全局 TypeScript 類型
+   payload.ts        # Payload 自動生成類型 re-export
+   ui.ts             # UI 組件 Props 類型
+   api.ts            # API 請求/響應類型
```

**理由**：當 AI 多代理並行開發時（如您 Prompt 中提到的「並行智能體」），清晰的功能域邊界可以**大幅減少衝突**。每個代理只需負責自己的 `features/` 子目錄。

---

### 問題 5：缺少 SEO 與效能層的規範設計 ⚠️

**問題根源：**
架構文件沒有提及 SEO 策略。雖然這是家庭私人網站，但以下兩點仍然重要：
1. **Open Graph / Social Sharing**：家庭成員分享自己頁面連結時，希望在 WhatsApp/LINE/微信中有精美的預覽卡片
2. **圖片效能**：未規範的圖片策略會讓旅遊相冊頁面在移動端嚴重卡頓

**改進建議：在 Coding Standards 中新增以下規範**

```typescript
// ✅ 每個路由 page.tsx 必須導出 generateMetadata
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `..., | Web Li`,
    description: `...`,
    openGraph: { images: [{ url: member.avatar.url }] },
  }
}

// ✅ 旅遊相冊頁必須使用 Next.js Image 的 sizes 屬性
<Image
  src={photo.url}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
  alt={photo.altText}
/>

// ✅ 重量級動畫組件（Framer Motion）使用動態載入
const Timeline = dynamic(() => import('@/features/timeline/Timeline'), {
  ssr: false,
  loading: () => <TimelineSkeleton />,
})
```

---

### 問題 6：`ContactInfo` Collection 設計過度 ⚠️

**問題根源：**
使用一個完整的 Payload Collection（對應一張資料庫表）來儲存幾個聯絡資訊鍵值對，是設計過度的表現。

**改進建議：改用 Payload Globals**

Payload CMS 提供了「Globals」概念，專為「全站唯一的單例設定」設計，且已在 `globals/SiteConfig.ts` 有雛形。應將 `ContactInfo` 合併進 `SiteConfig` Global：

```typescript
// globals/SiteConfig.ts
const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  fields: [
    { name: 'siteName', type: 'text', localized: true },
    { name: 'contactPhone', type: 'text' },
    { name: 'contactEmail', type: 'email' },
    { name: 'contactAddress', type: 'text', localized: true },
    { name: 'socialLinks', type: 'array', fields: [
      { name: 'platform', type: 'select', options: ['github', 'linkedin', 'instagram'] },
      { name: 'url', type: 'text' },
    ]},
    // 未來可擴展：公告橫幅、首頁跑馬燈文字等
  ]
}
```

這樣 **`ContactInfo` 集合可以刪除**，後台管理員只有一個「網站設定」入口，更直覺。

---

## 三、未來迭代方向的架構預留

根據您的需求，這個項目最可能的迭代方向是：

1. **家庭成員自主編輯自己的頁面**（需要 Row-Level Access Control）
2. **手機 App 快速上傳旅遊照片**（需要 API-first 設計）
3. **更豐富的互動功能**（留言、點讚、生日提醒）

### 建議在架構中預留的設計

**A. 成員角色權限（Row-Level Access Control）**

在 `Users` 集合中新增 `role` 與 `associatedMember` 欄位，讓未來每位家庭成員可以有自己的後台帳號，且**只能編輯屬於自己的資料**：

```typescript
// collections/Users.ts
{
  name: 'role',
  type: 'select',
  options: ['admin', 'member'],  // admin 可編輯全站；member 只能編輯自己
},
{
  name: 'associatedMember',
  type: 'relationship',
  relationTo: 'members',
  hasMany: false,
},
```

在 `Member` 集合的 `access.update` 中加入：
```typescript
update: ({ req: { user } }) =>
  user?.role === 'admin' || { id: { equals: user?.associatedMember?.id } }
```

**B. API 層（為未來 App 預留）**

現行 Coding Standards 規定「Frontend code MUST NOT directly call Payload's local API」，方向正確。但應進一步規範：

```diff
+ # 新增規範：所有數據獲取必須通過統一的 data-access 層
+ lib/
+   data/
+     members.ts      # getMemberBySlug(), getAllMembers()
+     timeline.ts     # getTimelineEvents(), getEventById()
+     travel.ts       # getTravelProjects(), getTravelBySlug()
```

這個 `lib/data/` 層封裝所有 Payload REST API 調用，未來無論是 Next.js Server Component、React Native App，還是第三方 AI 代理，都可以統一調用，**只需改動一處就能切換數據源**。

**C. 影像處理管道（為高清相冊預留）**

旅遊相冊頁面是效能瓶頸的重災區。建議在架構文件中預留 `Cloudflare Images Transform` 或 `Sharp` 的使用規範：

```
上傳流程：
原圖上傳 → Cloudflare R2 存儲原圖
            → Payload afterChange Hook 觸發
            → 生成 thumbnail (400px), medium (800px), large (1600px)
            → 將不同尺寸 URL 存入 Media 記錄的 sizes 欄位
```

---

## 四、修訂後的技術棧總覽

```diff
  Core Framework:   Next.js 14+ (App Router, TypeScript)       ✅ 保留
  Styling:          Tailwind CSS + shadcn/ui                    ✅ 保留
  Animations:       Framer Motion                               ✅ 保留
  i18n:             next-intl (zh-TW default, en fallback)     ✅ 保留
  CMS:              Payload CMS v3 (embedded in Next.js)        ✅ 保留
  Authentication:   Payload CMS built-in (NOT NextAuth)        ✅ 明確統一
- Database:         Vercel Postgres (Neon)                      ❌ 替換
+ Database:         Supabase PostgreSQL (連接池模式)             ✅ 推薦
- Media Storage:    Vercel Blob                                 ❌ 替換
+ Media Storage:    Cloudflare R2 (S3 adapter) + CDN           ✅ 推薦
  Deployment:       Vercel (GitHub auto-deploy)                 ✅ 保留
+ Image Pipeline:   Cloudflare Transform / Sharp (via Hook)     🆕 新增
+ Data Access Layer: lib/data/ (統一 API 封裝層)                🆕 新增
```

---

## 五、下一步行動

請確認以下兩個關鍵決策後，我們即可生成正式的 `implementation_plan.md` 並開始初始化：

> [!IMPORTANT]
> **決策 1：媒體儲存**
> 是否同意將 Vercel Blob 替換為 **Cloudflare R2**？（免費讀取流量，對相冊網站至關重要）

> [!IMPORTANT]
> **決策 2：資料庫**
> 是否同意將 Vercel Postgres 替換為 **Supabase PostgreSQL**？
> 或者偏好繼續使用 Vercel 生態（Vercel Postgres），接受其成本與冷啟動限制？
