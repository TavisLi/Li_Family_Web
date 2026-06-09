---
title: 家庭入口网站 - 全栈系统需求与技术架构说明书 (V3.1)
author: Tavis Li
date: 2026-05-30
---

Web Li 家庭入口网站 - 全栈系统需求与技术架构说明书 (V3 整合版)

版本: Version 3.0 (整合 V2 微交互与 V3 数据源规范)  
更新日期: 2026-05-29  
预设语言：繁体中文 (zh-TW) / 英文 (en) 双语切换  
核心技术: Next.js 14 App Router / Payload CMS v3 / Supabase / Cloudflare R2

#### 修订历史 (Revision History)

| 版本  | 日期  | 修订作者 | 修订内容说明 |
| --- | --- | --- | --- |
| V1.0 | 2026-05-27 | 系统架构组 | 完成 Next.js + Payload CMS + Supabase + Cloudflare R2 基础系统架构设计与基础页面需求定义。 |
| V2.0 | 2026-05-28 | 系统架构组 | 新增极致微交互 (Ambient UI、终端彩蛋、乐观更新与时空滑块) 及全域双模隐私门禁系统；加入 Blog 核心模组架构。 |
| V3.0 | 2026-05-29 | 系统架构组 | 1\. 深度整合外部资料源 ([family-members.md](http://family-members.md), tavis\_resume.md, lynn\_resume.md)，优化动态打字机、技能雷达图与履历时间轴模型<br><br>2\. 旅游系统整合外部专案 ([travel-projects.md](http://travel-projects.md), 202607 [重庆长江三峡8日.md](http://xn--8-io6ay88bcsbx3qexjm59djgg.md), 202308 [东澳全览9日.md](http://xn--9-lp6am9hqt3arglx81b.md))，规范规划中与已完成行程之数据解析逻辑。<br><br>3\. 清除不必要的 AI 生成冗余语句，保持技术文件的专业度与严谨性。<br><br>4\. 全面恢复并升级 Git 分支规范、开发工作流、环境变数范本及 Payload 集合总览。 |

## 1\. 专案愿景与世界级审美标准

Web Li 是一个定位为长期运营、承载数十年家庭记忆与情感的数字圣殿。本专案不以「完成基础功能」为终点，而是全面对标世界一流（World-Class）产品的工艺细节、人机互动、长期可持续性与隐私安全。本文件作为AI代理人（Claude Code / CODEX / Google Antigravity 等）与开发团队的最高指导原则。

### 1.1 氛围感知美学 (Ambient UI)

全站拒绝采用死板、突兀的深色/浅色切换。系统必须实作动态色彩过渡美学（Dynamic Thermography），让网页物理氛围随著当前浏览的主角或内容进行「呼吸式」转变：

-   Tavis Li (爸爸)：当切换至Tavis的页面或半导体科技板块时，全站的滚动条、毛玻璃边框与动态背景将平滑过渡为 Google/Apple 风格的极简冷调科技蓝。
    
-   Lynn Chien (妈妈)：当切换至Lynn的页面时，全站色调转入暖调莫兰迪米黄，营造优雅、温润的高雅视觉。
    
-   Leo Li (儿子)：当切换至Leo的页面时，全站过渡为赛博极客风（深黑底色配上丝滑的萤光绿微弱光晕）。
    

### 1.2 电影级动态与微互动

极致的质感来自于隐显之间的微小细节。所有动画效果必须遵循物理规律，拒绝线性过渡。

-   Canvas 粒子动画：首页与各欢迎区的粒子动画不可仅是随机漂浮，需具备鼠标引力磁场与滚动驱动动画 (Scroll-driven Animations)。
    
-   文字动画：文字在滚动时应具备从毛玻璃后方逐渐聚焦放大的电影质感。
    
-   3D Hover 特效：所有卡片元素均需配置 3D Hover 倾斜特效与弹簧物理动画 (Spring Physics)。
    

## 2\. 系统技术栈选型 (Tech Stack)

基于长期的效能、托管成本与可维护性评估，全面采用以下现代高扩展架构：

| 核心模组 | 选型技术 | 架构定位 |
| --- | --- | --- |
| 核心网页框架 | Next.js 14+ (App Router, TypeScript) | 全栈渲染、Server Components 效能优化 |
| 内容管理系统 | Payload CMS v3 (Embedded inside Next.js) | 单一真理源 (Single Source of Truth) |
| 资料库系统 | Supabase PostgreSQL (连接池模式) | 动态数据与持久化存储 |
| 媒体与文件储存 | Cloudflare R2 (S3 Adapter) + Cloudflare CDN | 海量相片与图片高画质存储及分发。<br><br>影像优化管道：Cloudflare Transform (自动转换 WebP/AVIF 格式与尺寸压缩) |
| 多语系支援 | next-intl (预设: zh-TW, 备用: en) | 全站静态与动态内容国际化 |
| 前端样式与动画 | Tailwind CSS / shadcn/ui / Framer Motion | 原子化样式、Radix 原生无障碍组件与物理动画 |
| 部署与 CI/CD | GitHub Repository + Vercel Deployment | 自动化流水线, main 分支推送即时部署 |

### 核心架构约束

1.  **零原生影片储存**：专案严禁提供上传、解码或串流原生影片档案（如 .mp4, .mov）的功能。所有影片在资料模型与 UI 层，均需以「YouTube 外部连结网址」的形式存在。多媒体组件遇到影片类型时，需调用 YouTube Thumbnail API 渲染预览图，并透过前端灯箱（Lightbox）内嵌 iframe 进行播放。
    
2.  **媒体储存去 Vercel 化**：所有相片及静态图片资产，必须透过 S3 适配器上传至 Cloudflare R2。严禁引入 Vercel Blob。
    
3.  **数据库冷启动防护**：数据库已切换至 Supabase PostgreSQL。编写后端与 CMS 连接代码时，必须使用连接池埠（Port 6543）并在连接字串带上 ?pgbouncer=true，以避免 Serverless 连接暴增与冷启动延迟。
    
4.  **数据获取层**：统一封装于 lib/data/，严禁前端组件直接呼叫 Payload 本地 API。
    

## 3\. 核心功能模组需求

### 3.1 个人首页动态架构 (Member Profiles)

个人首页的内容与结构必须严格动态解析根目录的 [family-members.md](http://family-members.md) 及其关联的外部履历文件。

-   爸爸 (Tavis Li) 页面：
    
    -   打字机核心组件：固定文字 「儿子、丈夫、父亲，以及近30年半导体产业经验的」 ，循环显示 \[‘工厂自动化’, ‘数字化转型’, ‘智能制造’\]，并紧跟固定文字 「专业工作者。」。
        
    -   技能雷达图与履历时间轴：开发团队与AI代理人必须编写动态解析脚本，解析 tavis\_resume.md 中的「核心能力」以生成雷达图数值；并提取其在长江存储、华亚科技、美光等核心里程碑，动态渲染至垂直科技感履历时间轴。
        
    -   信念与爱好：展示「天行健，君子以自强不息」及阅读、学习、旅行之内容。
        
-   妈妈 (Lynn Chien) 页面：
    
    -   打字机核心组件：固定文字 「女儿、妻子、母亲，以及热情温暖的」 ，循环显示 \[‘生活美学家’, ‘旅行探索者’, ‘家庭守护者’, ‘优雅生活家’\]，并紧跟固定文字 「优雅生活家。」。
        
    -   财务专业履历与时间轴：动态解析 lynn\_resume.md 内容，将其在台大会计系、勤业众信(审计经理)、台湾大哥大、台湾之星(稽核长)、长江存储等20年扎实的财务、内控、SAP与Hyperion系统导入等核心资产，转化为优雅卡片布局与专业时间轴。
        
-   儿子 (Leo Li) 页面：
    
    -   终端交互彩蛋：黑客终端机组件必须具备真实命令交互能力。输入 help 显示隐藏命令列表；输入 love 触发全萤幕丝滑流动的绿色二进位代码雨；输入 clear 清空终端。
        

### 3.2 旅游与规划互动系统 (Travel Projects)

每一个旅游项目必须以独立的一个以上网页呈现，其底层数据必须严格解析[travel-projects.md](http://travel-projects.md)及其关联的外部旅游文件。项目区分为「规划中」与「已完成」两种状态。

-   **规划中行程** (如 202607 重庆)：
    
    -   **数据解析源**：严格解析 [202607重庆长江三峡8日.md](http://xn--2026078-dw3kh71iipdfv0amyr8g5ip2k.md)，提取6人出行名单、航班资讯(MU3539, 3U3784)、住宿交通与核心防暑降温提醒。
        
    -   **高密度互动组件**：页面的各项细分内容(如饭店选择、景点排程、费用估算)必须启用让用户添加 comment、Thumb-up 和 Thumb-down 的功能, 人添加评论
        
        （Comments）、点赞（Thumb-up）与点踩（Thumb-down）的功能，且必须清晰展示操作者的用户名。且必须清晰展示操作者的用户名, 以辅助家庭决策。
        
-   **已完成行程** (如 202308 东澳)：
    
    -   **数据解析源**：严格解析 [202308东澳全览9日.md](http://xn--2023089-p03k68vvn9c1swkm3e.md)，提取其墨尔本古董蒸汽火车、企鹅归巢、悉尼蓝山等核心里程碑、航班与小费细节。
        
    -   **回忆分享组件**：视觉上转为莫兰迪色系暖色调，著重于旅游心得、大图瀑布流照片（Masonry Layout）与 YouTube / 云端平台影片连结的流畅嵌入与点击播放。
        

### 3.3 顶级家庭部落格系统 (Premium Family Blog)

为满足家庭长期的思想沉淀、生活随笔与知识分享需求，全新引入世界级规格的 Blog 模组。

-   **模组化区块编辑器 (Block Editor)**：后台采用 Payload CMS 的 Rich Text (Lexical) 区块系统，支援家人无痛嵌入式多种组件 (如：Markdown 语法、精致的代码高亮区块、流畅的大图排版、YouTube 影片、或是家庭成员专属的投票与代办元件)。
    
-   **深度成员关联**：每篇 Blog 文章需强关联作者（authors），并在前端展示极具质感的作者 Hover Card（浮动卡片），滑动显示该成员的最新动态、精简履历与快速对话通道。并可透过链接跳转到相对应的个人首页。
    
-   **多维度分类与动态标签云**：支援按照多种维度进行交叉筛选。前端实作具备微弱物理碰撞效果的标签云（Tag Cloud）。
    
-   **情感互动留言板**：每篇 Blog 下方除了常规文字评论外，加入专为家人设计的「暖心表情快速回应」（如：温馨、太酷了、赞、辛苦了），且评论与回应必须支持 useOptimistic 乐观更新，达成无延迟互动。
    
-   **多语系SEO优化**：自动生成具备正确语系标签的静态页面(ISR)，内建JSON-LD结构化数据。
    

### 3.4 门禁与双模隐私系统 (Family-Only Secure Gate)

家庭入口网站涉及高度敏感的隐私数据。系统必须具备**公开（Public）与私密（Family-Only）双模切换机制**。

-   **访客模式 (Public)**：未登入的外部访客仅能看见公开的成员介绍、公开 Blog 文章、公开的旅游合影与精简大事记。
    
-   **家人模式 (Private)**：家庭成员通过后台验证或前端安全 Session 暗号解锁后，系统采用无感局部刷新，解锁完整的敏感相册、吐槽点评、详细日程与个人成长足迹。
    

### 3.5 时空胶囊大事记 (Time Machine Timeline)

打破扁平的大事记流水帐，引入「时空滑块（Time Machine Slider）」概念。当使用者在时间轴上拖动年份（例如从2026拖回2013）时，网页主体色调将短暂泛黄，页面透过动态滤镜与动画，自动过渡并聚焦至该年份的家庭核心事件、当时成员的青涩头像与历史相片，创造强烈的情感震撼。

### 3.6 年度时光报告与共同愿望清单 (Wrapped & Bucket List)

-   **家庭共同愿望清单 (Family Bucket List)**：全家共同维护的愿望看板。当某项愿望被勾选完成时，全站触发 Canvas 萤幕烟火特效，并自动归档至大事记中。
    
-   **年度时光报告 (Family Wrapped)**：对标 Spotify Wrapped。每年12月31日系统根据资料库自动产生成员与家庭的年度大数据视觉报告，统计过去一年的足迹、照片量与互动之最。
    

### 3.7 終端交互彩蛋 (Leo's Terminal Interaction)

为了展现极客风的极致工艺，Leo Li 页面的黑客终端机组件必须具备真实命令交互能力。家人在输入框内输入help 可顯示隱藏命令列表；輸入 love 觸發全螢幕絲滑流動的綠色二進位代碼雨；輸入 clear 清空終端。以数字化彩蛋凝聚家庭趣味。

## 4\. 目录结构规范 (Directory Structure)

专案结构必须保持高度模组化，明确划分「通用组件」与「业务功能域」，以利多代理（Multi-Agent）并行开发时减少代码冲突。

```plaintext
├── app/                      # Next.js App Router 路由層
│   ├── (app)/                # 前台展示頁面 (Localized 路由)
│   └── (cms)/                # Payload CMS 後台路由 (/admin)
├── components/               # ⚠️ 僅存放「純粹的通用無狀態組件」
│   ├── ui/                   # shadcn/ui 自動生成組件
│   ├── layout/               # 全站通用布局 (Header, Footer)
│   └── icons/                # 專案通用圖標組件
├── features/                 # ⚠️ 【核心】按業務功能域組織的業務組件與邏輯
│   ├── member/               # 成員個人檔案頁功能域
│   ├── timeline/             # 家庭時間軸功能域
│   ├── travel/               # 旅遊相冊與紀錄功能域 (包含 YouTube 燈箱播放)
│   ├── home/                 # 首頁特有組件
│   └── admin/                # CMS 後台自定義擴充組件
├── lib/
│   ├── data/                 # ⚠️ 數據獲取層 (封裝所有 CMS 讀取邏輯)
│   │   ├── members.ts
│   │   ├── timeline.ts
│   │   └── travel.ts
│   └── utils.ts              # 工具函式
├── types/                    # ⚠️ 集中管理全局 TypeScript 類型
│   ├── payload.ts            # Payload 自動生成類型之 Re-export
│   ├── ui.ts                 # UI 組件 Props 類型
│   └── api.ts                # API 請求/響應類型
├── public/                   # 靜態資源
└── .env.example              # 環境變數範
```

1.  **嚴格邊界**：禁止將帶有業務邏輯的組件直接丟進 `components/`。必须采用 Feature-Driven 架构。你所开发的代码若属于特定业务，必须严格限缩在 `features/[member|timeline|travel|home|admin]/` 资料夹内，以确保与其他并行开发的智能体互不干涉。
    
2.  **数据调用防护：**前端任何 Server/Client 组件均不得直接调用 Payload 的 Local API（如 `payload.find`）。所有数据请求必须导向 `lib/data/` 层对应的封装函式。
    
3.  **效能与 SEO 要求：**
    

-   所有前台 `page.tsx` 必須包含 `generateMetadata` 导出，且必须妥善处理图片的 Open Graph 预览 URL。
    
-   所有图片组件必须使用 Next.js `Image` 并配置精确的 `sizes` 属性（如相册瀑布流：`sizes="(max-width: 768px) 100vw, 33vw"`）。
    
-   Framer Motion 等复杂动画组件，在进入主页或旅游详情页时，必须使用 `next/dynamic`（`ssr: false`）进行非同步载入，防止拖慢首屏渲染。
    

## 5\. 核心资料模型设计 (Payload Collections)

Payload CMS 的 Collection 配置是本系统资料库的唯一真理源 (Single Source of Truth)。所有资料表更动必须透过修改 Collection 设定并自动生成资料库迁移 (Migration) 档案执行。

### 5.1 Posts (部落格文章模型)

```typescript
export const Posts: CollectionConfig = {
slug: ‘posts’,
admin: { useAsTitle: ‘title’, group: ‘Content’ },
access: {
read: ({ req: { user } }) => {
if (user) return true; // 已登入家庭成员可看所有
return { isPrivate: { equals: false } }; // 访客仅能看公开文章
},
},
fields: [
{ name: ‘title’, type: ‘text’, required: true, localized: true },
{ name: ‘slug’, type: ‘text’, required: true, unique: true },
{ name: ‘author’, type: ‘relationship’, relationTo: ‘users’, required: true },
{ name: ‘categories’, type: ‘relationship’, relationTo: ‘categories’, hasMany: true },
{ name: ‘isPrivate’, type: ‘checkbox’, defaultValue: true, label: ‘私密文章 (仅限家庭成员)’ },
{ name: ‘publishedDate’, type: ‘date’, required: true },
{ name: ‘coverImage’, type: ‘relationship’, relationTo: ‘media’, required: true },
{ name: ‘content’, type: ‘richText’, required: true, localized: true }, // Lexical 区块编辑器
{ name: ‘tags’, type: ‘array’, fields: [{ name: ‘tag’, type: ‘text’ }] }
]
}
```

### 5.2 TravelProjects (旅游行程模型)

```typescript
exports const TravelProjects: CollectionConfig = {
slug: ‘travel-projects’,
admin: { useAsTitle: ‘title’, group: ‘Content’ },
fields: [
{ name: ‘title’, type: ‘text’, required: true, localized: true },
{ name: ‘status’, type: ‘select’, options: [‘planning’, ‘completed’], required: true },
{ name: ‘isPrivate’, type: ‘checkbox’, defaultValue: true },
{ name: ‘startDate’, type: ‘date’, required: true },
{ name: ‘endDate’, type: ‘date’, required: true },
{ name: ‘externalDocIdentifier’, type: ‘text’, description: ‘对应外部 markdown 文件的识别码’ }
]
}
```

### 5.3 Comments (全站情感互动模型)

```typescript
export const Comments: CollectionConfig = {
slug: ‘comments’,
fields: [
{ name: ‘user’, type: ‘relationship’, relationTo: ‘users’, required: true },
{ name: ‘associatedType’, type: ‘select’, options: [‘travel’, ‘timeline’, ‘blog’], required: true },
{ name: ‘associatedId’, type: ‘text’, required: true }, // 关联各模组的 ID
{ name: ‘commentText’, type: ‘textarea’, required: false },
{ name: ‘reaction’, type: ‘select’, options: [‘none’, ‘up’, ‘down’, ‘heart’, ‘cool’, ‘applause’] },
{ name: ‘createdAt’, type: ‘date’, required: true }
]
}
```

### 5.4 Media (媒体流水线模型)

配合 Cloudflare R2，所有相片上传流程由 afterChange 钩子 (Hook) 自动触发 Sharp 处理。原始高画质图留存 R2，前端根据 sizes 栏位异步加载 400px (Thumbnail), 800px (Medium), 1600px (Large) 的 WebP 图片，严格杜绝 LCP 效能瓶颈。

```typescript
// collections/Media.ts
import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
slug: 'media',
upload: {
staticURL: '/media',
staticDir: 'media',
disableLocalStorage: true, // 僅使用 Cloudflare R2 儲存
imageSizes: [
{ name: 'thumbnail', width: 400, height: undefined, crop: 'center' },
{ name: 'medium', width: 800, height: undefined, crop: 'center' },
{ name: 'large', width: 1600, height: undefined, crop: 'center' },
],
adminThumbnail: 'thumbnail',
},
fields: [
{
name: 'type',
type: 'select',
required: true,
defaultValue: 'photo',
options: [
{ label: '照片', value: 'photo' },
{ label: '影片 (YouTube)', value: 'video' },
],
},
{
name: 'youtubeUrl',
type: 'text',
label: 'YouTube 影片網址',
admin: {
condition: (data) => data?.type === 'video',
},
validate: (val) => {
if (!val) return true
const regExp = /^.(youtu.be/|v/|u/\w/|embed/|watch?v=|&v=)([^#&?]).*/
return regExp.test(val) ? true : '請輸入有效的 YouTube 網址'
},
},
{
  name: 'altText',
  type: 'text',
  localized: true,
  required: true,
},
{
  name: 'tags',
  type: 'array',
  fields: [{ name: 'tag', type: 'text' }],
},
{
  name: 'relatedMembers',
  type: 'relationship',
  relationTo: 'members',
  hasMany: true,
},
{
  name: 'relatedTravel',
  type: 'relationship',
  relationTo: 'travel-projects',
  hasMany: false,
},
],
}
```

### 5.5 SiteConfig (全站設定 - Global)

全站唯一单例模型，全站联络资讯与基本设定，必须统一由 Payload Globals 中的 SiteConfig 进行读写。避免滥用 Collection 导致数据库割裂。

```plaintext
// globals/SiteConfig.ts
import { GlobalConfig } from 'payload/types'

export const SiteConfig: GlobalConfig = {
slug: 'site-config',
fields: [
{ name: 'siteName', type: 'text', required: true, localized: true },
{ name: 'siteDescription', type: 'textarea', localized: true },
{
type: 'ui',
name: 'contactSectionLabel',
admin: { components: { Field: () => '--- 聯絡資訊 ---' } }
},
{ name: 'contactPhone', type: 'text' },
{ name: 'contactEmail', type: 'email' },
{ name: 'contactAddress', type: 'text', localized: true },
{
name: 'socialLinks',
type: 'array',
fields: [
{ name: 'platform', type: 'select', options: ['github', 'linkedin', 'instagram', 'youtube'] },
{ name: 'url', type: 'text', required: true },
],
},
],
}
```

## 6\. Git 与分支协作规范

为确保专案程式码的安全与多端协作的丝滑，团队与 AI 代理人必须严格遵守以下 Git 分支工作流：

-   main 分支：生产环境主分支。此分支受保护，严禁直接推送（Push）代码。只有通过本地验证且审查通过的Pull Request (PR)才能合并至此分支。一旦合并，Vercel 将自动触发CI/CD生产环境部署。
    
-   dev 分支：日常开发与整合分支。所有的功能分支在完成本地测试后，必须先合并至 dev 分支进行多端联调与自动化架构校验。
    
-   功能分支 (feature/\*)：新功能 (如 feature/blog-module, feature/member-timeline) 必须基于最新版 dev 分支拉取独立功能分支进行隔离开发。
    
-   修复分支 (bugfix/\* 或 hotfix/\*)：常规错误与紧急线上故障修复，须拉取独立分支并在验证后快速合并。
    

## 7\. Payload 核心开发工作流

开发团队与 AI 代理人必须严格执行以下标准化工作流，以维护单一真理源：

1.  启动本地开发: 执行 pnpm dev, Next.js 与 Payload CMS v3 将同时在本地启动。
    
2.  修改资料模型：任何栏位的增减或关系变更，必须仅在 collections/ 目录下的原始码档案中进行。
    
3.  生成资料库迁移：修改完成后，Payload 将自动检测变更，开发者需手动执行 pnpm payload migrate:create \[migration-name\] 生成具备时间戳记的PostgreSQL 迁移指令码。
    
4.  应用迁移与验证：执行 pnpm payload migrate 将变更套用至 Supabase 本地或开发资料库，并前往 [http://localhost:3000/admin](http://localhost:3000/admin) 验证后台 UI 与权限限制。
    

## 8\. 环境变数配置范本 (Environment Variables)

本地开发与 Vercel 线上环境必须配置以下环境变数，严禁将其硬编码至代码库中：

```plaintext
# Core Payload Server Configuration

PAYLOAD_SECRET=your_super_secure_payload_secret_here
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Supabase PostgreSQL Connection Pool (Transaction Mode for Serverless)

DATABASE_URI=postgresql://postgres.your-project-id:your-password@aws-0-us-east-1.pooler.supabase.com

# Cloudflare R2 S3 API Configuration for Media Storage

R2_BUCKET_NAME=web-li-media-bucket
R2_ACCOUNT_ID=your_cloudflare_account_id_here
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
NEXT_PUBLIC_R2_PUBLIC_URL=https://media.webli.portal.com
```

## 9\. 技术边界与极致效能规范 (Notes for AI)

当AI代理人进行代码编写与架构迭代时，必须强制遵循以下工程边界，违反者将被判定为重大架构缺陷：

! 核心限制与工程边界 (Strict Technical Bounds)

-   **严禁手写资料库 Schema**: Payload CMS 采用的 Collection 结构为系统唯一真理源。严禁手动编写或修改 Prisma/Drizzle Schema, 所有资料表更动必须透过修改 Collection 设定并自动生成资料库迁移 (Migration) 档案执行。
    
-   **严禁在客户端泄漏密钥**: PAYLOAD\_SECRET、DATABASE\_URI 以及 R2\_ACCESS\_KEY\_ID 和 R2\_SECRET\_ACCESS\_KEY 必须严密保留在 Server 侧，绝不允许进入 “use client” 组件。
    
-   **大图瀑布流优化**: 所有相簿与 Blog 封面必须严格配置 Next.js 的 sizes 属性。对于动态 Canvas 或复杂 3D 卡片组件，强制使用 next/dynamic 的 { ssr: false } 进行非同步载入，确保网站 LCP 评分稳居世界顶级 (95分以上)。
    
-   **去中心化资料备份**: 后台必须实作一键导出指令，点击后可在 10 秒内将 Supabase 内的所有文字、评论、大事记与部落格打包成单一 JSON 包，并提供 R2 备份清单，达成极致的数位遗产安全维护。
