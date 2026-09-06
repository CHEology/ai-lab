# 添加文字与 Blue Note 回应

首次运行 `npm ci`，之后 `npm run dev` 预览。`marked` 是锁定版本的构建依赖；浏览器不请求解析器、AI API 或数据库。

在 `writing/entries.json` 的 `collections` 添加有实际作品的分组，再在 `entries` 登记条目。数组顺序就是目录顺序。每个条目提供唯一 `id`、`title`、`collection` 和 `status`。回应还需要 `source.title` 与 `source.url`，标题必须相同。

回应有自己的标题时，填写可选的 `responseTitle`，它用于阅读页 H1 和浏览器标题。`title` 仍保留原文标题，供目录与固定 URL 使用；不把回应标题重复写进 Markdown 正文。

`pending` 条目不填写正文、作者署名或发布日期。待写页面可以通过 `/ai-lab/writing/bluenote/修图/` 等原标题地址访问，且不允许搜索引擎索引。

填写正文时：

1. 将已经审阅的 Markdown 放到 `writing/bodies/`；正文不含页面标题和返回导航，模板会生成它们。
2. 设置 `body` 为 `bodies/文件名.md`，填写实际发布日期 `published`（YYYY-MM-DD），将 `status` 改成 `published`。有明确署名时填写 `byline`，按实际记录 AI 生成与作者编辑；未提供时省略该字段，不猜测作者或模型名称，也不因此暂停发布。
3. 运行 `npm run check`。空正文、重复地址、非法原文链接或原文标题不一致会使构建失败。
4. 预览 `/ai-lab/`、`/ai-lab/writing/` 和单篇 URL，并验证原文往返。先发布 AI Lab 对应页，再在 Blue Note 添加文末链接。
5. 作者已于 2026-09-05 授权后续请求的站点与内容更新通过检查后直接上线：提交并推送到 `main`，确认 GitHub Actions 成功和线上页面正确，无需再次询问发布确认。若作者明确要求仅预览或保留草稿，则遵循当次要求。

`draft` 条目不生成页面或目录链接，但公开仓库内的源文件仍然公开。正文支持 Markdown 与可信的手写 HTML；相对图片／附件必须指向最终页面能访问的本站资源，校验器会检查本地链接。

分类、条目元数据和 Markdown 不直接复制到站点。只输出生成页面与 `site/` 的公共资源。原有 `experiments/` 继续使用独立的 `project.json` 和 `public/`。
