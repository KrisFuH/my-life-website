# my-life-website · 前端

个人生涯记录网站的前端（React + Vite + React Router）。

## 技术栈

- React 18 + React Router 6
- Vite 5
- 纯 CSS 变量主题（支持浅色 / 深色切换）

## 页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 个人简介与板块入口 |
| `/journey` | 来时路 | 人生经历（密码保护） |
| `/skills` | 习艺录 | 学会的技能 |
| `/experiences` | 拾光集 | 主动体验（游戏、阅读、旅行等） |

## 运行

```bash
pnpm install
pnpm dev
```

开发服务器默认运行在 http://localhost:5173 ，`/api` 会代理到后端（默认 http://localhost:3001）。

> 本仓库仅包含前端代码；后端（Express + SQLite）在单独的项目中。