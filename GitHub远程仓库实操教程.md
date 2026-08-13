# GitHub 远程仓库实操教程

> 用猜数字游戏从零打通 GitHub 远程仓库全流程

---

## 目录

1. [GitHub 仓库是什么](#1-github-仓库是什么)
2. [准备工作](#2-准备工作)
3. [核心概念一览](#3-核心概念一览)
4. [核心命令速查](#4-核心命令速查)
5. [动手实践：把猜数字游戏推上 GitHub](#5-动手实践把猜数字游戏推上-github)
   - [Step 1：在 GitHub 上创建远程仓库](#step-1在-github-上创建远程仓库)
   - [Step 2：关联本地仓库和远程仓库](#step-2关联本地仓库和远程仓库)
   - [Step 3：推送代码到 GitHub](#step-3推送代码到-github)
   - [Step 4：在 GitHub 上查看你的代码](#step-4在-github-上查看你的代码)
   - [Step 5：修改代码并再次推送](#step-5修改代码并再次推送)
   - [Step 6：拉取远程仓库的更新](#step-6拉取远程仓库的更新)
   - [Step 7：克隆仓库到另一台电脑](#step-7克隆仓库到另一台电脑)
6. [日常开发流程（肌肉记忆）](#6-日常开发流程肌肉记忆)
7. [常见问题排查](#7-常见问题排查)
8. [命令对照表（你想不起时就来翻）](#8-命令对照表你想不起时就来翻)

---

## 1. GitHub 仓库是什么

### 用大白话讲

**本地仓库**：你电脑上的项目文件夹 + 一个隐藏的 `.git` 目录。`.git` 目录就像一台"时光机"，记录了你每次保存（commit）时的快照，你可以随时穿越回过去的任意一个版本。

**GitHub 远程仓库**：把上面的时光机，在 GitHub 的服务器上存了一份一模一样的副本。这样：

- **备份**：电脑坏了也不怕，代码在 GitHub 云上有备份
- **协作**：别人也能看到、下载、甚至一起修改你的代码
- **展示**：就像程序员的简历，让别人看到你的作品

| 概念 | 类比 |
|------|------|
| 本地仓库 | 你家书桌上的草稿本 |
| 远程仓库（GitHub） | 云端的"网盘"，存了一份完全相同的备份 |
| push（推送） | 把草稿本复印一份，寄到云端保存 |
| pull（拉取） | 从云端把最新版本下载到草稿本 |
| clone（克隆） | 别人把你的整本草稿复印一份到自己家 |

---

## 2. 准备工作

### 2.1 确认 git 已安装

打开 iTerm（终端），输入：

```bash
git --version
```

如果显示类似 `git version 2.39.x`，说明已安装。没有的话会提示你安装 Command Line Tools，按提示操作即可。

### 2.2 确认 GitHub 账号已登录

打开 iTerm，输入：

```bash
ssh -T git@github.com
```

如果看到 `Hi <你的用户名>! You've successfully authenticated...`，说明 SSH 已配好。

**如果报错 `Permission denied`**，说明还没配 SSH 密钥，按下面步骤来：

#### 生成 SSH 密钥（只需做一次）

```bash
# 1. 生成密钥对（一直按回车就行，不用填密码）
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 2. 复制公钥内容
cat ~/.ssh/id_ed25519.pub
```

输出的一大串文字，全部选中复制。

#### 把公钥贴到 GitHub 上

1. 浏览器打开 [https://github.com/settings/keys](https://github.com/settings/keys)
2. 点绿按钮 **"New SSH key"**
3. Title 随便填，比如"iTerm on Mac"
4. Key 贴入刚才复制的内容
5. 点 **"Add SSH key"**

再回到 iTerm 测试：

```bash
ssh -T git@github.com
```

看到 `Hi xxx!` 就 OK。

### 2.3 本教程使用的示例项目

本次实操的项目是 `/Users/liuxiaoming/Project/guess-number`，一个 TypeScript 写的**猜数字游戏**：

- 电脑随机选一个 1~100 的数字
- 玩家输入猜测，系统告诉你"大了"还是"小了"
- 30 秒限时
- 作弊检测（方向错了会报警）
- 记录最高分

它已经有 2 个 git 提交记录，但还没关联任何远程仓库。正好拿它来演示。

---

## 3. 核心概念一览

| 概念 | 大白话解释 |
|------|-----------|
| **commit（提交）** | 给当前文件状态拍一张"快照"，附带一段说明文字。这是 git 的原子操作 |
| **branch（分支）** | 一条独立的开发线。默认叫 `main` 或 `master`。你可以想象成一条主线，可以随时拉出一根"岔道"去开发新功能 |
| **remote（远程）** | 远程仓库的"别名"，一般是 `origin`。就像你把一个远方的地址存成通讯录里的名字 |
| **push** | 把你的提交推送到远程仓库。类比：把本地照片上传到 iCloud |
| **pull** | 把远程仓库的新提交拉到本地。类比：从 iCloud 下载别人共享的照片 |
| **clone** | 把远程仓库完整复制到本地。类比：下载一个别人的项目文件夹到你的电脑 |
| **fetch** | 只看看远程有没有新东西，但不合并。类比：看一眼 iCloud 有哪些新照片，先不下载 |
| **.gitignore** | 指定哪些文件不归 git 管。比如 node_modules（依赖包目录）、.env（密钥文件）等不需要上传的东西 |

---

## 4. 核心命令速查

| 命令 | 作用 | 类比 |
|------|------|------|
| `git init` | 把当前文件夹变成一个 git 仓库 | 在这个文件夹里装一台"时光机" |
| `git status` | 查看当前仓库状态：有哪些文件改过、哪些还没保存 | 清单检查：哪些东西变了 |
| `git add .` | 把所有改动加入"暂存区" | 把要拍进照片的东西摆好 |
| `git add <文件名>` | 只把指定文件加入暂存区 | 只摆特定几样东西 |
| `git commit -m "描述"` | 把暂存区的内容拍成一张快照 | 按快门，照片标题写"描述" |
| `git log --oneline` | 查看提交历史 | 翻相册，看之前拍了哪些照片 |
| `git push` | 把本地的新提交推到远程 | 把新照片上传到 iCloud |
| `git pull` | 把远程的新提交拉到本地 | 下载 iCloud 里别人上传的新照片 |
| `git clone <网址>` | 把远程仓库完整下载到本地 | 下载别人的整个项目到你的电脑 |
| `git remote -v` | 查看当前关联了哪些远程仓库 | 查通讯录：我的远程地址是什么 |

---

## 5. 动手实践：把猜数字游戏推上 GitHub

> **前置条件**：确保已完成 [2. 准备工作](#2-准备工作) 的所有步骤。

---

### Step 1：在 GitHub 上创建远程仓库

**这一句在浏览器操作，不是终端**

1. 浏览器打开 [https://github.com/new](https://github.com/new)
2. Repository name 填 `guess-number`
3. Description 填：基于 TypeScript 的猜数字游戏，支持限时、作弊检测、最高分
4. **选 Public**（公开，所有人都能看到。想私密就选 Private，但免费账户不能设多个协作者）
5. **千万不要勾选** "Add a README file"
6. **千万不要勾选** "Add .gitignore"
7. **千万不要勾选** "Choose a license"
8. 点击绿色的 **"Create repository"** 按钮

> **为什么不要勾选那三项？** 因为我们本地仓库已经有代码和 `.gitignore` 了。如果 GitHub 自动生成这些文件，两边内容会冲突，推送时就会报错。

创建完成后，你会看到一个页面，中间有几行代码。留意里面类似这样的地址：

```
git@github.com:你的用户名/guess-number.git
```

这就是你的**远程仓库地址**。复制好，下一步要用。

---

### Step 2：关联本地仓库和远程仓库

回到 iTerm，进入项目目录：

```bash
cd /Users/liuxiaoming/Project/guess-number
```

**先确认一下本地的状态：**

```bash
# 看看有没有关联远程仓库（当前应该没有）
git remote -v
```

你应该看到**空白输出**，说明没有任何远程关联。很好，这正是我们要做的。

**把 GitHub 远程仓库地址绑定到本地：**

```bash
# 把粘贴你刚才复制的地址（替换中文部分）
git remote add origin git@github.com:你的用户名/guess-number.git
```

> **逐个词大白话解释：**
> - `git remote add` — "给远程仓库加个联系方式"
> - `origin` — 你给这个远程地址取的外号（行业默认叫 origin，就像微信里"我妈"的备注）
> - 最后那段 `git@github.com:...` — 就是真实的通讯地址

验证一下是否添加成功：

```bash
git remote -v
```

应该看到输出类似：

```
origin	git@github.com:你的用户名/guess-number.git (fetch)
origin	git@github.com:你的用户名/guess-number.git (push)
```

有 fetch 和 push 两条，分别代表"从这个地址拉"和"往这个地址推"。通常它们指向同一个地方。

---

### Step 3：推送代码到 GitHub

现在本地的时光机里已经有 2 张快照（我们之前已经 commit 过了），该把它们发到 GitHub 了：

```bash
git push -u origin master
```

> **大白话解释：**
> - `git push` — "推送，上传"
> - `-u` — 设定"以后默认就往这推"，只需第一次加。以后直接敲 `git push` 就行
> - `origin` — 往哪个远程仓库推（就是刚才绑定的那个）
> - `master` — 把本地哪条分支推上去（本项目主分支叫 `master`，新项目默认多为 `main`）

如果一切顺利，输出大概是这样：

```
枚举对象中: 15, 完成.
对象计数中: 100% (15/15), 完成.
使用 16 个线程进行压缩
压缩对象中: 100% (13/13), 完成.
写入对象中: 100% (15/15), 6.25 KiB | 3.12 MiB/s, 完成.
总共 15（差异 1），复用 0（差异 0），包复用 0
remote: Resolving deltas: 100% (1/1), done.
To github.com:你的用户名/guess-number.git
 * [new branch]      master -> master
分支 'master' 设置为跟踪来自 'origin' 的 'master'。
```

看到 `master -> master` 就说明推送成功。

> **小提示**：如果你的项目默认分支叫 `main` 而不是 `master`，就把命令里的 `master` 换成 `main`。不确定的话先敲 `git branch` 看一下。

---

### Step 4：在 GitHub 上查看你的代码

刷新你刚才创建的 GitHub 仓库页面（地址是 `https://github.com/你的用户名/guess-number`），你会发现：

- 所有源代码文件都在（`src/` 目录下的 `.ts` 文件）
- `package.json`、`tsconfig.json` 等配置文件也在
- `node_modules/` 目录**没有**出现 — 因为 `.gitignore` 让它被忽略了
- 页面上方有 "2 commits" 的标识，点进去能看到完整提交记录

🎉 恭喜，你的猜数字游戏已经成功登上 GitHub 了！

---

### Step 5：修改代码并再次推送

现在模拟真实的开发场景：改点代码，然后推上去。

**5.1 改代码 — 加一句问候**

用编辑器打开 `src/cli.ts`，找到：

```typescript
output("Welcome to Guess Number!");
```

改成：

```typescript
output("Welcome to Guess Number! Let's have fun!");
```

保存文件。

**5.2 查看发生了什么变化**

```bash
git status
```

你会看到 `src/cli.ts` 显示为红色，表示"被修改了，但还没告诉 git"。

> `git status` 是**最常用的命令之一**。任何时候不知道仓库什么状态了，先敲它看一眼。它就像汽车仪表盘。

**5.3 三步走：add → commit → push**

这是 git 的"标准三段式"，也是日常工作中重复最多的动作：

```bash
# 第一步：把修改的文件加入"暂存区"（告诉 git：这些文件我要拍照）
git add src/cli.ts

# 第二步：拍快照，附带说明信息
git commit -m "docs: 优化欢迎语"

# 第三步：推到 GitHub
git push
```

> **commit 信息怎么写？** 常见规范是 `类型: 做了什么`。比如：
> - `feat: 添加倒计时声音`
> - `fix: 修复分数保存失败`
> - `refactor: 重构游戏引擎`

去 GitHub 刷新页面，可以看到提交记录变成了 3 个。

---

### Step 6：拉取远程仓库的更新

**场景**：你在公司电脑上推了一次，回家用自己的笔记本想继续写。或者同事往项目里加了一段代码。这时你需要"拉取"最新代码。

**6.1 模拟：在 GitHub 网页上直接改文件**

1. 打开你的 GitHub 仓库页面
2. 点进 `README.md` 文件（如果没有，点 "Add file" → "Create new file"，文件名叫 `README.md`）
3. 随便写点内容，比如：

```markdown
# Guess Number

一个基于 TypeScript 的命令行猜数字游戏。

## 功能
- 1~100 随机数
- 30 秒限时挑战
- 作弊检测
- 最高分记录

## 启动方式
npm start
```

4. 拉到页面下方，commit message 写 `docs: 添加 README`
5. 点绿色 "Commit new file" 按钮

**好了，现在远程仓库比本地多了一个 README.md 文件。**

6.2 拉取到本地

回到 iTerm：

```bash
git pull
```

输出会告诉你下载了哪些文件。现在本地也多了一个 `README.md`。

> **大白话**：`git pull` = "去云端看看有没有新照片，有的话自动下载到本地"。它实际上是两个动作的合体：`git fetch`（看看有没有） + `git merge`（有的话合进来）。

---

### Step 7：克隆仓库到另一台电脑

**场景**：你在一台全新的电脑上，什么都没有，想从头开始搞这个项目。

```bash
# 找一个别的目录（模拟"新电脑"的效果）
cd /tmp

# 克隆整个仓库
git clone git@github.com:你的用户名/guess-number.git guess-number-copy

# 进入克隆出来的目录
cd guess-number-copy

# 安装依赖
npm install

# 跑游戏试试
npm start
```

> `git clone` = "把整个项目（包括所有的历史记录）完整下载下来"。不仅仅是下载文件，连时光机（.git 目录）也一起下载了。所以下载完后你也能看历史记录、切换版本。

---

## 6. 日常开发流程（肌肉记忆）

以后你每天写代码的标准节奏：

```bash
# 1. 开工前，先把远程的更新拉下来（防止冲突）
git pull

# 2. 写代码...改 bug...加功能...

# 3. 看看自己改了啥
git status

# 4. 把所有修改加入暂存区
git add .

# 5. 提交（拍照）
git commit -m "feat: 添加了什么功能"

# 6. 推到 GitHub
git push
```

每天的工作就是这个循环：**pull → 写代码 → add → commit → push**，重复三到五遍。时间长了就变成肌肉记忆了。

---

## 7. 常见问题排查

### Q1: push 时报 `Permission denied (publickey)`

**原因**：SSH 密钥没配或配错了。

**解决**：回到 [2.2 节](#22-确认-github-账号已登录)，重新走一遍 SSH 密钥配置流程。

---

### Q2: push 时报 `failed to push some refs`

完整报错大概是：

```
! [rejected] master -> master (fetch first)
hint: Updates were rejected because the remote contains work that you do not have locally.
```

**原因**：远程仓库有你本地没有的提交（比如你在网页上直接改了东西）。

**解决**：很直接，按错误提示做就行——

```bash
git pull
# 如果有冲突，处理冲突后
git push
```

> 养成习惯：每次 push 前先 pull 一下。

---

### Q3: pull 时报 `merge conflict`

**原因**：你和远程仓库**改了同一个文件的同一行**，git 不知道该听谁的。

**表现**：文件里出现这样的标记：

```
<<<<<<< HEAD
你的版本
=======
远程的版本
>>>>>>> origin/master
```

**解决**：手动编辑文件，删掉冲突标记，保留你想要的版本，然后：

```bash
git add .
git commit -m "fix: 解决合并冲突"
git push
```

---

### Q4: 不小心推了不该推的文件（比如 node_modules）

**解决**：

```bash
# 1. 先在 .gitignore 里添加 node_modules/（确保以后不再跟踪）
echo "node_modules/" >> .gitignore

# 2. 让 git 停止跟踪这个目录
git rm -r --cached node_modules

# 3. 提交并推送
git add .gitignore
git commit -m "chore: 忽略 node_modules"
git push
```

---

### Q5: commit 信息写错了想改

**如果还没 push**：

```bash
git commit --amend -m "新的commit信息"
```

**如果已经 push 了**：原则上不建议改（因为别人可能已经拉取了）。如果是你自己的个人仓库且确定没人拉过：

```bash
git commit --amend -m "新的commit信息"
git push --force-with-lease
```

> `--force-with-lease` 是相对安全的强制推送方式，它会在覆盖前确认远程没有被别人改动过。

---

## 8. 命令对照表（你想不起时就来翻）

| 你想做什么 | 敲这行命令 | 备注 |
|-----------|-----------|------|
| 把文件夹变成 git 仓库 | `git init` | 只需要一次 |
| 看看现在仓库什么状态 | `git status` | 用最频繁，没有之一 |
| 把修改放进暂存区 | `git add .` | 全部加进去 |
| 只加某个文件 | `git add 文件名` | 精准加 |
| 提交（拍快照） | `git commit -m "干了什么"` | -m 后面是说明 |
| 看提交历史 | `git log --oneline` | 简洁模式 |
| 关联远程仓库 | `git remote add origin 地址` | 只需做一次 |
| 查看关联的远程地址 | `git remote -v` | 看看绑定了谁 |
| 推送到 GitHub | `git push` | 第一次要加 `-u origin master` |
| 从 GitHub 拉取更新 | `git pull` | 开工前先拉 |
| 下载一个别人的仓库 | `git clone 地址` | 下载到当前目录 |
| 查看分支 | `git branch` | 看当前有哪些分支 |
| 创建新分支 | `git branch 分支名` | 从当前节点分叉 |
| 切换到其他分支 | `git switch 分支名` | 或 `git checkout 分支名` |
| 暂存当前修改（临时） | `git stash` | 暂时"藏起来" |
| 取出暂存 | `git stash pop` | 刚才藏的拿出来 |
| 撤销某个文件的修改 | `git restore 文件名` | 回到上次 commit 的状态 |
| 查看某次提交的详细改动 | `git show 提交ID` | 提交ID 从 `git log` 里复制前 7 位就行 |
| 不想管某个文件了 | 在 `.gitignore` 里加入文件名 | 通配符 `*.log` 表示所有 .log 文件 |

---

## 附录：你现在可以做什么

1. **按教程实操一遍** — 把猜数字游戏真正推到你的 GitHub 上
2. **在 GitHub 仓库页面**：
   - 点 "Settings" → "Pages" 看看能不能部署网页（这个项目是命令行的，没法部署。以后做网页项目可以）
   - 把仓库链接分享给朋友
3. **下一阶段学习方向**：
   - 分支管理（`git branch`、`git merge`）
   - Pull Request（团队协作的核心流程）
   - GitHub Actions（自动化测试和部署）

---

> **一句话总结**：git 就是给项目装一台时光机，GitHub 就是把这台时光机备份到云上。你每天做的事就是 **拉取 → 修改 → 暂存 → 提交 → 推送**，这五个动作来回重复。
