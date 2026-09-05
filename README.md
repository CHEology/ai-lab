# ai-lab

尝试和展示用 AI 做的新鲜玩意儿：文本、代码、游戏、页面，以及更多实验。

- 网站：https://cheology.github.io/ai-lab/
- 仓库：https://github.com/CHEology/ai-lab

这是与 Blue Note 分开维护、分开发布的独立网站。当前是初始版本，包含四类作品展示区，尚未收录实验。

## 本地运行

需要 Node.js 22 或更新版本，没有第三方运行或构建依赖。

```sh
npm run dev
```

打开 http://127.0.0.1:4173/ai-lab/ 。预览包含 GitHub Pages 的 `/ai-lab/` 路径。修改文件后重新运行即可；也可以另开终端执行 `npm run build`，然后刷新页面。

```sh
npm run check  # 校验作品资料并构建到 dist/
```

## 添加作品

详见 [添加实验](docs/ADDING-EXPERIMENTS.md)。每个实验独占一个目录，既可以放可直接打开的静态作品，也可以链接到独立部署的作品。首页在构建时按分类、日期自动收录。

```text
experiments/<slug>/
  project.json       作品名称、分类、日期和介绍
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
