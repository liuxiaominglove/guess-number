# Git 反悔大全：四种方法撤销你的操作

> 用猜数字游戏实操 stash / restore / reset / revert

---

## 目录

1. [先搞清楚：git 的三个"区域"](#1-先搞清楚git-的三个区域)
2. [四种反悔方式一图看懂](#2-四种反悔方式一图看懂)
3. [场景一：改到一半要切走 → `git stash`](#3-场景一改到一半要切走--git-stash)
4. [场景二：改了还没 add → `git restore`](#4-场景二改了还没-add--git-restore)
5. [场景三：add 了但还没 commit → `git restore --staged`](#5-场景三add-了但还没-commit--git-restore---staged)
6. [场景四：已经 commit 了 → `git reset`](#6-场景四已经-commit-了--git-reset)
7. [场景五：已经 push 了 → `git revert`](#7-场景五已经-push-了--git-revert)
8. [四种方式决策树](#8-四种方式决策树)
9. [命令速查表](#9-命令速查表)

---

## 1. 先搞清楚：git 的三个"区域"

Git 里你的代码在三个地方流转：

```
你的文件夹          →    暂存区           →     仓库（时光机）
(工作区)                (舞台/候车厅)           (本地仓库 → GitHub)
```

| 区域 | 大白话 | 文件在哪 |
|------|--------|---------|
| **工作区** | 你正在编辑的文件，就是硬盘上那些 `.ts` 文件 | 看得见摸得着，VS Code 里直接改 |
| **暂存区** | `git add` 之后，文件进入的"候车厅"，排队等着下一次拍照 | 存在于 `.git` 隐藏文件夹里，你看不到 |
| **仓库** | `git commit` 之后，照片正式存入时光机 | `.git` 隐藏文件夹里 |

---

## 2. 四种反悔方式一图看懂

```
文件被你改坏了，想反悔？

改完还没 git add                    git add 但还没 commit           git commit 但还没 push            已经 push 了
       │                                      │                              │                            │
       ▼                                      ▼                              ▼                            ▼
   git restore                           git restore --staged             git reset                     git revert
   ↓                                    ↓                                ↓                            ↓
  直接扔掉修改                          把文件从"候车厅"                  把时光机倒带                    写一张"反向"新照片
  回到上次拍照的样子                    拽回工作区                       到之前的某张照片                抵消那次修改
```

| 命令 | 反悔到什么程度 | 类比 |
|------|--------------|------|
| `git restore` | 丢掉还没 add 的修改 | 揉掉草稿纸，重写 |
| `git restore --staged` | 把 add 进去的文件退出来 | 从候车室把人叫回来，不上车了 |
| `git reset` | 回到之前的某次 commit | 时光机倒带，回到以前的某张照片 |
| `git revert` | 用一次新 commit 抵消旧 commit | 不删照片，而是在后面多拍一张"反向动作"的照片 |
| `git stash` | 暂时把修改"藏起来" | 把做到一半的草稿折起来，放抽屉里，先干别的 |

---

## 3. 场景一：改到一半要切走 → `git stash`

### 场景

你正改着代码，老板突然喊你修一个线上的 bug。但你现在的改动只做了一半，不想提交，又不想丢掉。

### 类比

你正在画一幅画，画到一半有人敲门。你把画纸**卷起来放抽屉里**（stash），起身去开门。回来后再**展开继续画**（stash pop）。

### 实操

**3.1 模拟：先改点东西**

确保你在项目目录：

```bash
cd /Users/liuxiaoming/Project/guess-number
```

打开 `src/cli.ts`，随便加一行注释，但不保存成 commit。比如加了这行：

```typescript
// TODO: 这个功能还在开发中，先藏起来
```

看一下状态：

```bash
git status
# 显示 src/cli.ts 被修改（红色）
```

**3.2 藏起来**

```bash
git stash
```

> `stash` 翻译成中文就是"藏、暂存"。这条命令把你所有未提交的修改打包塞进一个"抽屉"里，工作区恢复得干干净净，就像什么都没改过一样。

再跑一次 `git status`：

```bash
git status
# 干干净净！src/cli.ts 的修改消失了（它被藏在 stash 里了）
```

**3.3 去干别的事**

现在你可以切分支、pull 代码、修 bug。工作区是干净的。

**3.4 回来，取出来**

```bash
git stash pop
```

> `pop` = "弹出来"。把刚才藏进抽屉的东西拿出来，恢复到你 interrupt 之前的那个状态。

`git status` 再看看——`src/cli.ts` 的修改又回来了。

**3.5 常用 stash 命令**

| 命令 | 作用 |
|------|------|
| `git stash` | 把所有未提交的改动藏起来 |
| `git stash pop` | 取出最近一次藏的，并删除它 |
| `git stash list` | 看看抽屉里都藏了啥 |
| `git stash drop` | 丢掉最近一次藏的（不要了） |
| `git stash clear` | 清空所有藏的 |

---

## 4. 场景二：改了还没 add → `git restore`

### 场景

你改了一段代码，越改越乱，想回到**上次拍照时的样子**。而且还没 `git add`。

### 类比

你在草稿纸上画画，画砸了。你把纸**揉成一团扔掉**，换一张跟上次一模一样的复印纸重新画。

### 实操

**4.1 模拟：先故意改坏**

在 `src/cli.ts` 里随便删一行，或者乱改几行。比如把第 31 行改成：

```typescript
output("垃圾垃圾垃圾垃圾垃圾垃圾");
```

保存。跑 `git status`，看到 `src/cli.ts` 标红（被修改）。

**4.2 反悔**

```bash
git restore src/cli.ts
```

> 翻译：别管我这次改了什么，给我恢复到上次 `git commit` 拍的那张照片里的样子。

**4.3 验证**

```bash
git status
# 干净了！
```

打开 `src/cli.ts`，内容恢复原样。

**如果反悔了"反悔"：** 一旦跑了 `git restore`，修改就**永久丢了**，git 也找不回来。删除前想清楚。

---

## 5. 场景三：add 了但还没 commit → `git restore --staged`

### 场景

你不小心 `git add .` 把所有文件都加进去了，但只想提交其中一部分，想把多余的文件从**暂存区**退回去。

### 类比

你让所有人进候车厅排队（`git add .`），然后发现小明不该上这趟车。你叫**"小明，别上车了，回去等着"**，但小明本身一点没变，只是不参与这次出发。

### 实操

**5.1 模拟：把多个文件 add 进去**

```bash
# 先改 cli.ts（模拟一个你不想提交的改动）
# 再改 index.ts（模拟你想提交的改动）
# 然后全加进去
git add .
```

跑 `git status`，两个文件都变绿了（进入暂存区）。

**5.2 把 cli.ts 从暂存区退回去**

```bash
git restore --staged src/cli.ts
```

**5.3 再看状态**

```bash
git status
```

你会看到：
- `src/cli.ts` 又变回**红色**（修改还在，但不在暂存区了）
- `src/index.ts` 保持**绿色**（还在候车厅排着）

> `--staged` 的意思：只动暂存区，不动文件本身。文件内容完全没变，只是不再参加下一次 commit 了。

---

## 6. 场景四：已经 commit 了 → `git reset`

### 场景

你刚刚 commit 了一下，突然发现改错了，或者改得不应该。想回到**上一个 commit 的状态**。

### 类比

时光机里已经存了第 5 张照片，但你觉得第 4 张更好。你**启动时光机**，回到第 4 张照片的时刻。第 5 张照片虽然删了，但照片里的内容（你的修改）还在桌面上。

### 实操

**6.1 模拟：先做一个"坏"commit**

```bash
# 在 index.ts 随便加一行：
// BAD: this is a bad commit
```

```bash
git add .
git commit -m "feat: 测试用的坏提交，等下要删掉"
```

干完后看看历史：

```bash
git log --oneline
```

你会看到最上面是你刚才的"坏提交"。

**6.2 反悔：回到上一次 commit**

```bash
git reset HEAD~1
```

> 逐步翻译：
> - `HEAD`：你**当前**站的位置（最新一张照片）
> - `~1`：往回数 1 张照片
> - `HEAD~1`：上一次 commit
> - 整体：时光机倒带一格，并且把那次 commit 的修改还给你（变成未暂存的修改）

**6.3 发生了什么？**

```bash
git log --oneline
# 坏提交消失了！
```

```bash
git status
# 但代码修改还在！文件是红色的，没有被丢掉
```

这就是 `git reset` 的默认行为（`--mixed` 模式）：撤销 commit，但保留代码修改，让你可以改了再重新提交。

**6.4 三种 reset 模式**

| 命令 | commit 记录 | 暂存区 | 工作区 | 什么时候用 |
|------|-----------|--------|--------|-----------|
| `git reset --soft HEAD~1` | 删掉 | 保留（绿色） | 保留 | commit 完发现忘了加文件 |
| `git reset --mixed HEAD~1`（默认） | 删掉 | 清空（红色） | 保留 | commit 完想重新整理修改 |
| `git reset --hard HEAD~1` | 删掉 | 清空 | **清空，全丢掉** | 确定这次提交是垃圾，全不要了 |

> ⚠️ **`--hard` 是核武器**：commit 删了，代码也没了，找不回来。使用前三思。

---

## 7. 场景五：已经 push 了 → `git revert`

### 场景

你已经把代码推到 GitHub 上了，而且队友可能已经 pull 了你的代码。这时候不能用 `git reset`（会破坏别人的历史），只能用 `git revert`。

### 类比

你不撕掉之前的那张照片（别人手里已经有复印本了），而是**多拍一张新照片**，这张新照片的内容是"把上次那张照片的效果反过来做一遍"。

### 实操

**7.1 先找到你想撤销的那次 commit**

```bash
git log --oneline
```

假设你想撤销 `f25c7c4 docs: 优化欢迎语` 这次提交。

**7.2 撤销它**

```bash
git revert f25c7c4
```

> 翻译：对 `f25c7c4` 这次提交做一个"反向操作"。如果你那次提交是加了一行文字，`revert` 就是删掉那行文字。

Git 会弹出一个编辑器让你写 commit 信息（默认是 `Revert "docs: 优化欢迎语"`），直接保存退出就行。

**7.3 看看历史**

```bash
git log --oneline
```

你会看到在原来的提交后面**多了一条新提交**，内容是"撤销 XX 提交"。原来的提交还在，只是效果被抵消了。

**7.4 推上 GitHub**

```bash
git push
```

---

## 8. 四种方式决策树

```
代码改坏了，想回去
    │
    改完还没 git add？
    ├── 是 → git restore <文件名>                     （直接扔掉修改）
    ├── 是，但想留到以后再用 → git stash              （先藏起来）
    │
    已经 git add 了？
    ├── 是 → git restore --staged <文件名>            （从候车厅拽出来）
    │
    已经 git commit 了？
    ├── 是，还没 push → git reset HEAD~1              （倒带一格）
    │
    已经 push 了？
    └── 是 → git revert <提交ID>                      （新提交抵消旧提交）
```

**记住一句话：** 反悔的代价随进度递增——越往后，反悔越复杂。能 `restore` 就别 `reset`，能 `reset` 就别 `revert`。

---

## 9. 命令速查表

| 我现在的情况 | 敲这个命令 | 后果 |
|-------------|-----------|------|
| 文件改乱了，没 add | `git restore 文件名` | 修改丢掉，回到上次 commit 的样子 |
| 不小心 add 了不想提交的文件 | `git restore --staged 文件名` | 从暂存区退出，修改还在 |
| 改到一半要切去干别的事 | `git stash` | 修改藏起来，工作区干净 |
| 刚才藏的拿出来继续 | `git stash pop` | 恢复修改，抽屉里清除 |
| 看抽屉里藏了哪些 | `git stash list` | 列表显示 |
| commit 了但想撤回（保留修改） | `git reset HEAD~1` | commit 删掉，修改回到工作区（红色） |
| commit 了想撤回（连修改一起丢） | `git reset --hard HEAD~1` | commit 和修改全没了，慎用 |
| 回到 3 个 commit 之前 | `git reset HEAD~3` | 往后退 3 步 |
| 已经 push 了，想撤销 | `git revert <提交ID>` | 生成一条新 commit 来抵消 |
| 撤销刚刚的 revert（反悔的反悔） | `git revert <revert的提交ID>` | 再生成一条新 commit，抵消抵消 |
| 看最近 10 次提交，找提交 ID | `git log --oneline -10` | 列表显示 |

---

> **一句话总结：** 反悔没那么可怕，关键是想清楚"你的改动走到哪一步了"——在桌面上（工作区）、在排队（暂存区）、在相册里（仓库）、还是已经寄给了别人（push 了）。然后对着表格找对应的命令。
