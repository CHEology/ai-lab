# ai-lab

AI 实验作品。

- 网站：https://cheology.github.io/ai-lab/
- 仓库：https://github.com/CHEology/ai-lab

这是与 Blue Note 分开维护、分开发布的独立网站。首页保留蓝色 logo，并以可展开的文件夹目录组织作品。“文字 → Blue Note 回应”收录对应原文的独立回应页；已发布条目显示正文，其余明确标为待写。

## 本地运行

需要 Node.js 22 或更新版本。首次运行 `npm ci` 安装锁定的 Markdown 构建依赖；页面无浏览器运行依赖。

```sh
npm run dev
```

打开 http://127.0.0.1:4173/ai-lab/ 。预览包含 GitHub Pages 的 `/ai-lab/` 路径。修改文件后重新运行即可；也可以另开终端执行 `npm run build`，然后刷新页面。

```sh
npm run check  # 校验作品资料并构建到 dist/
```

## 添加作品

编辑文字前先读 [文字排版与引用规范](docs/WRITING-DESIGN.md)（agent / AI 必读），操作步骤见 [添加文字](docs/ADDING-WRITING.md)，全站视觉见 [设计规范](docs/DESIGN.md)。文字页采用原标题路径，例如 `/ai-lab/writing/bluenote/修图/`。

详见 [添加实验](docs/ADDING-EXPERIMENTS.md)。每个实验独占一个目录，既可以放可直接打开的静态作品，也可以链接到独立部署的作品。首页在构建时自动收录，按日期从新到旧排列，只显示作品名称。

```text
experiments/<slug>/
  project.json       作品名称与排序日期
  public/            本站托管时，仅此目录会发布
    index.html       作品入口
site/                首页、样式、图标和 404 页面
scripts/             构建与本地预览
.github/workflows/   GitHub Pages 自动发布
```

## 发布

GitHub 仓库的 Settings → Pages → Source 使用 **GitHub Actions**。推送到 `main` 后，工作流构建并发布 `dist/`；拉取请求只做构建校验。整个仓库不会作为网站目录直接上传。

静态作品使用相对资源路径。需要服务端或 AI API 的作品，可以单独部署后以外部链接收录；不要把 API 密钥写入网页、浏览器脚本或提交到仓库。

该仓库是公开的。`draft: true` 只阻止作品出现在网站和部署产物中，不会让已提交的源码变成私有。
