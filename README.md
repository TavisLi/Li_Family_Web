# Web Li - 家庭门户网站

一个现代科技风的家庭门户网站，展示家庭成员信息、大事记、旅游相册，并提供后台管理系统。
我的第一个项目，运用现代AI技术进行开发

## ✨ 功能特性

- 🏠 **首页**：科技粒子动画、全家福、动态跑马灯、成员3D卡片入口
- 👨‍👩‍👧‍👦 **成员主页**：自定义风格（爸爸科技风、妈妈温暖风、女儿少女风、儿子极客风）
- 📅 **家庭大事记**：科技感时间轴，支持旅游项目标记
- ✈️ **旅游项目主页**：行程时间轴 + 瀑布流照片墙 + Lightbox 预览
- 🔐 **后台管理 (CMS)**：基于 Payload CMS，支持事件/旅游/媒体/联系信息管理

## 🛠️ 技术栈
- **前台與後台一體化**：Next.js 15 (App Router) & Payload CMS v3 stable (Embedded)
- **資料庫**：Supabase PostgreSQL (經由連接池穩定運行)
- **多媒體儲存**：Cloudflare R2 (相片與圖片儲存，讀取流量完全免費)
- **影片處置**：嵌入式 YouTube 播放系統（全站不存放原生影片，節省成本與串流頻寬）
- **UI 與樣式**：Tailwind CSS + shadcn/ui + Framer Motion (流暢平滑動畫)
- **國際化**：next-intl (支援繁體中文、英文)

## 🚀 快速开始

### 前置要求

- Node.js 20 LTS（本專案固定使用 `20.20.2`；Payload CMS v3 要求 Node.js `20.9.0+`，請避免使用 Node 24/26 執行 migration）
- pnpm (推荐) 或 npm
- Vercel 帐号（用于部署）
- Supabase PostgreSQL 与 Cloudflare R2 帐号（用于数据库与媒体储存）

### 1. 克隆仓库

```bash
git clone https://github.com/TavisLi/Li_Family_Web.git 
cd Li_Family_Web
```
### 2. 安装依赖
```bash
nvm use
pnpm install
```
### 3. 配置环境变量

复制 .env.example 到 .env，并填入真实值：

```bash
cp .env.example .env
```
必需的环境变量：

- PAYLOAD_SECRET – 随机字符串，用于会话加密
- DATABASE_URI – Supabase PostgreSQL 连接池字符串
- R2_BUCKET_NAME / R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY – Cloudflare R2 存储配置
- NEXT_PUBLIC_SERVER_URL – 当前部署的公开站点 URL；Production 使用正式网域，Preview 使用对应的 Vercel Preview URL
- NEXT_PUBLIC_R2_PUBLIC_URL – R2/CDN 公开读取地址。媒体会由 Payload S3 adapter 生成直连 URL，不应填写 R2 S3 API endpoint

`PAYLOAD_SECRET`、`DATABASE_URI`、`R2_ACCESS_KEY_ID` 与 `R2_SECRET_ACCESS_KEY` 只能设为 Vercel 的 server-side 环境变量，绝不可使用 `NEXT_PUBLIC_` 前缀或传给 client component。

### 4. 运行数据库迁移

```bash
pnpm payload migrate
```
### 5. 启动开发服务器

```bash
pnpm dev
```
访问 http://localhost:3000 查看前台，http://localhost:3000/admin 进入后台（首次需创建管理员账号）。


## 🌐 国际化

- 默认语言：繁体中文 (zh-TW)
- 支持语言：英文 (en)
- 通过 URL 路径前缀切换，如 /en/members/tavis

## 📦 部署

本项目以 Vercel 部署 Next.js 与 Payload，以 Supabase 提供 PostgreSQL、Cloudflare R2 提供媒体储存：

1. 将代码推送到 GitHub 仓库，并在 Vercel 导入项目。
2. 在 Preview 与 Production 分别设定 `.env.example` 中列出的变量。Production 的 `NEXT_PUBLIC_SERVER_URL` 必须是正式网域；Preview 必须是该 Preview deployment URL，避免 canonical 与 Open Graph 指向错误环境。
3. 在 Cloudflare R2 连接 public domain 或 `r2.dev` domain，并将其填入 `NEXT_PUBLIC_R2_PUBLIC_URL`。R2 S3 endpoint 只供 Payload 上传使用。
4. 每次 branch push 检查 Preview；合并到 `main` 后检查 Production。验证清单见 `docs/production-deployment-checklist.md`。
5. 发生回归时在 Vercel 恢复到最近一次可用 Production deployment，并重新执行公开/家人模式 smoke test。

## 🤝 贡献

目前为私人项目，暂不接受外部 PR。如有建议可联系项目维护者。

## 📄 许可证

私有项目，仅限家庭成员使用。

项目详细需求、成员数据、AI 开发规范请参考：

- architecture.md – 技术架构与编码规范
- CLAUDE.md – AI 行为准则
- family-members.md – 家庭成员信息
- travel-projects.md – 旅游项目信息
- travel-content-source-guidelines.md – 新增旅游项目的 Markdown、照片与影片准备规范
- content-source-asset-guidelines.md – content-source/assets 照片与媒体命名规范
- Web Li Prompt.txt – 原始功能需求

## Phase 交付报告

每个 Phase 完成后的正式交接报告统一存放于：

```text
docs/phase-completion-reports/
```

报告需记录 Phase 范围、branch/commit、GitHub 同步或 PR 状态、验证命令、Browser QA、已知限制与下一 Phase 准备事项。

尚未进入正式交付、用于后续 Phase 开工准备的工作流记录统一存放于：

```text
docs/phase-preparation/
```

准备文档需记录建议分支、当前阻塞、必读上下文、可复用基础、验收清单与完成报告位置。
