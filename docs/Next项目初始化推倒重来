非常抱歉，这是我的绝对疏忽！你说得完全正确，`docs/`、`content-source/` 和 `.claude/` 这些核心资产和配置档案是项目的心血，**绝对不能直接 `rm -rf**`。

为了在保护现有文件的同时，获得最纯净的 Payload v3 + Next.js 初始化环境，我们采用“安全清理 + 临时目录替换法”。请在终端中确保你当前处于 `li_family_web/` 目录下，然后一步步执行以下操作：

### Step 1: 精准清理旧的 Next.js 脚手架文件

我们只删除之前 `create-next-app` 生成的代码和配置，**保留所有你的业务文档**。

在终端执行以下命令（这会删除代码文件夹和配置文件）：

```bash
# 删除依赖和编译缓存
rm -rf node_modules .next

# 删除旧的代码与公共资源目录
rm -rf src public app components

# 删除旧的配置文件 (如果有的文件不存在，终端会提示 no such file，忽略即可)
rm -f package.json pnpm-lock.yaml next.config.mjs tsconfig.json tailwind.config.ts postcss.config.js .eslintrc.json package-lock.json yarn.lock
```

*执行完毕后，你的 `li_family_web/` 目录下应该只剩下 `docs/`、`content-source/`、`.claude/` 以及你的说明书 md 文件。*

### Step 2: 在临时目录生成纯净的 Payload v3 项目

为了避免新旧文件冲突，我们在当前目录下创建一个临时文件夹来接收 Payload 的初始化。

```bash
pnpm create payload-app@beta temp-payload

```

在交互式提示中，请做以下选择：

- **Template**: 选择 `Next.js` (或者默认的空白/官方推荐模板，确保是 Next.js App Router 架构)。
- **Database**: 选择 `Postgres` (为了后续无缝对接 Supabase)。
- **Package Manager**: 建议选择 `pnpm`。

### Step 3: 将纯净代码“乾坤大挪移”到根目录

现在 `temp-payload` 文件夹里是一个完美的、符合要求的全栈空壳。我们需要把里面的所有东西（包括隐藏文件）移到当前的 `li_family_web/` 目录下。

```bash
# 将临时目录下的所有常规文件和文件夹移动到当前目录
mv temp-payload/* .

# 将临时目录下的隐藏文件（如 .env, .gitignore 等）也移动到当前目录
mv temp-payload/.* . 2>/dev/null || true

```

### Step 4: 清理临时目录并重新安装依赖

移动完成后，那个临时文件夹就没用了，我们将其删掉，并确保依赖包在当前根目录正确挂载。

```bash
# 删除空了的临时文件夹
rm -rf temp-payload

# 重新安装并链接依赖（确保 pnpm 环境在当前目录生效）
pnpm install

```

### Step 5: 验证目录结构

现在你可以使用 `ls -la` 检查一下目录，完美的结构应该是这样的：

* `docs/` (你的蓝图，安全)
* `content-source/` (你的 Markdown 数据，安全)
* `.claude/` (AI 代理人配置，安全)
* `src/` (全新的 Payload v3 + Next.js App Router 目录)
* `payload.config.ts` (核心配置)
* `package.json` (包含正确的依赖)

最后，你可以测试运行 `pnpm dev`。如果终端没有报错并成功启动了服务，你就可以放心地把更新后的 `CLAUDE.md` 和提示词交给 AI，让它开始安全地执行 Phase 1 的任务了！

---

## Git & GitHub Operation

既然你的专案已经由 Git 管理并且连接了 GitHub，刚才我们进行的「删除旧框架、移入新框架」的操作，在 Git 的眼中就是一次**大规模的档案删除与新增**。

由于你保留了 `docs/` 等核心目录，这些档案的 Git 历史并不会断裂。现在我们需要将这次架构升级稳妥地提交（Commit）并推送到 GitHub。

请在终端机（确保在 `li_family_web/` 根目录下）依序执行以下指令：

### Step 1: 检查 Git 状态

首先，确认 Git 是否正确察觉了变动。

```bash
git status

```

*你会看到一大串红色的 `deleted:`（旧的 Next.js 档案）以及一堆未追踪的新档案（Payload v3 的档案）。这是完全正常的。*

### Step 2: 暂存所有变更（包含删除的档案）

使用 `-A` (All) 参数，告诉 Git 完整记录所有的「新增」、「修改」与「删除」动作。

```bash
git add -A

```

### Step 3: 建立里程碑提交 (Commit)

为这次重大架构转换写下清晰的 Commit 讯息，这对于未来的版本回溯非常重要。

```bash
git commit -m "chore: 架构重构 - 彻底清除旧版 Next.js，初始化 Payload CMS v3 与 App Router 整合架构"

```

### Step 4: 推送至 GitHub

依照你在《系统架构说明书》第 6 节定下的 Git 协作规范，如果你目前在 `main` 分支，且尚未设定严格的 PR 保护，可以直接推送：

```bash
git push origin main

```

*(如果你习惯在开发分支作业，请将 `main` 替换为 `dev`：`git push origin dev`)*

---

### 💡 提交后的常见现象说明

完成推送后，你去 GitHub 网页端查看代码库，会发现这次的 Commit 记录非常庞大（可能显示 `+10,000` 行，`-5,000` 行等）。这在底层的框架迁移中是标准现象，无需担心。

你的 `docs/` 和 `content-source/` 依然安静地躺在那里，而原本的代码域 `src/` 已经被成功置换为 Payload v3 的纯净血液。现在的环境已经完全符合 AI 代理人接手 Phase 1 的前置要求了！
