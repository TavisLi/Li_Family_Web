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
- **前台與後台一體化**：Next.js 14+ (App Router) & Payload CMS v3 (Embedded)
- **資料庫**：Supabase PostgreSQL (經由連接池穩定運行)
- **多媒體儲存**：Cloudflare R2 (相片與圖片儲存，讀取流量完全免費)
- **影片處置**：嵌入式 YouTube 播放系統（全站不存放原生影片，節省成本與串流頻寬）
- **UI 與樣式**：Tailwind CSS + shadcn/ui + Framer Motion (流暢平滑動畫)
- **國際化**：next-intl (支援繁體中文、英文)

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm (推荐) 或 npm
- Vercel 账号 (用于数据库和存储)

### 1. 克隆仓库

```bash
git clone https://github.com/TavisLi/Li_Family_Web.git 
cd Li_Family_Web
```
### 2. 安装依赖
```bash
pnpm install
```
### 3. 配置环境变量

复制 .env.example 到 .env.local，并填入真实值：

```bash
cp .env.example .env.local
```
必需的环境变量：

- PAYLOAD_SECRET – 随机字符串，用于会话加密
- DATABASE_URI – Vercel Postgres 连接字符串
- BLOB_READ_WRITE_TOKEN – Vercel Blob 存储令牌
获取方式：在 Vercel 项目控制台的 Storage 标签页创建 Postgres 和 Blob，然后运行 vercel env pull .env.local

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

本项目专为 Vercel 优化：

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入该项目
3. 添加上述环境变量
4. 部署自动完成（每次推送到 main 分支都会触发）

## 🤝 贡献

目前为私人项目，暂不接受外部 PR。如有建议可联系项目维护者。

## 📄 许可证

私有项目，仅限家庭成员使用。

项目详细需求、成员数据、AI 开发规范请参考：

- architecture.md – 技术架构与编码规范
- CLAUDE.md – AI 行为准则
- family-members.md – 家庭成员信息
- travel-projects.md – 旅游项目信息
- Web Li Prompt.txt – 原始功能需求
