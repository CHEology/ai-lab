# 添加文字与 Blue Note 回应

首次运行 `npm ci`，之后 `npm run dev` 预览。`marked` 是锁定版本的构建依赖；浏览器不请求解析器、AI API 或数据库。

在 `writing/entries.json` 的 `collections` 添加有实际作品的分组，再在 `entries` 登记条目。数组顺序就是目录顺序。每个条目提供唯一 `id`、`title`、`collection` 和 `status`。回应还需要 `source.title` 与 `source.url`，标题必须相同。

当前四篇均为 `pending`，不填写正文、作者署名或发布日期。页面可以通过 `/ai-lab/writing/bluenote/修图/` 等原标题地址访问，且不允许搜索引擎索引。

填写正文时：

1. 将已经审阅的 Markdown 放到 `writing/bodies/`；正文不含页面标题和返回导航，模板会生成它们。
2. 设置 `body` 为 `bodies/文件名.md`，填写真实 `byline` 和 `published`（YYYY-MM-DD），将 `status` 改成 `published`。署名按实际记录 AI 生成与作者编辑；不要猜测模型名称。
3. 运行 `npm run check`。空正文、重复地址、非法原文链接或原文标题不一致会使构建失败。
4. 预览 `/ai-lab/`、`/ai-lab/writing/` 和单篇 URL，并验证原文往返。先发布 AI Lab 对应页，再在 Blue Note 添加文末链接。

`draft` 条目不生成页面或目录链接，但公开仓库内的源文件仍然公开。正文支持 Markdown 与可信的手写 HTML；相对图片／附件必须指向最终页面能访问的本站资源，校验器会检查本地链接。

分类、条目元数据和 Markdown 不直接复制到站点。只输出生成页面与 `site/` 的公共资源。原有 `experiments/` 继续使用独立的 `project.json` 和 `public/`。
