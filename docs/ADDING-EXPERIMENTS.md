# 添加实验

## 在本站托管

在 `experiments/` 新建一个目录，名称使用小写英文字母、数字和连字符，例如 `word-play`。添加 `project.json`：

```json
{
  "title": "你的作品名称",
  "date": "2026-09-04",
  "draft": false
}
```

首页使用一份简单的作品名称列表，不分区，也不显示日期或介绍。`date` 只用于从新到旧排序，不需要填写分类。

把可发布的文件放入该实验的 `public/`，入口为 `public/index.html`。文字作品可放在 HTML 页面中，代码作品可提供演示与源码链接，游戏和交互页面可携带自己的 JavaScript、CSS 与素材。

例如 `experiments/word-play/public/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>你的作品名称 · ai-lab</title>
  </head>
  <body>
    <nav><a href="../../">返回 ai-lab</a></nav>
    <main>
      <h1>你的作品名称</h1>
      <p>作品内容。</p>
    </main>
  </body>
</html>
```

作品会发布到 `https://cheology.github.io/ai-lab/experiments/word-play/`。资源使用 `./style.css` 等相对路径，不要使用会跳出项目路径的 `/style.css`。如果作品由其他框架生成，把构建后的静态文件放入 `public/`。

## 收录外部作品

如果作品已有独立网址，在 `project.json` 中增加 `externalUrl`，无需 `public/`：

```json
{
  "title": "你的外部作品",
  "date": "2026-09-04",
  "externalUrl": "https://example.com/your-project/"
}
```

外部链接必须是 HTTPS。填写 `externalUrl` 时，构建只生成链接，不复制该实验的 `public/`。

## 草稿与检查

- `draft: true`：不收录到首页，不复制到网站产物。公开仓库里的源码仍然公开。
- `draft` 省略或设为 `false`：收录并校验资料。作品按日期从新到旧排列。
- 运行 `npm run check` 校验名称、日期、链接和本地入口，运行 `npm run dev` 查看首页与作品页面。
- 本站托管作品只能发布 `public/` 中的静态文件。构建会拒绝该目录中的隐藏文件、符号链接与 `node_modules`。
- 推送到 `main` 后，GitHub Actions 自动部署。

旧资料中的 `category`、`description` 可以保留，但不参与首页展示，也不是必填字段。
