# 添加文字与 Blue Note 回应

编辑前先读 [文字排版与引用规范](WRITING-DESIGN.md)；它是 agent / AI 处理正文、标题、引用和注释的执行标准。首次运行 `npm ci`，之后 `npm run dev` 预览。`marked`、`marked-footnote` 与 `katex` 是锁定版本的构建依赖；浏览器不请求解析器、AI API 或数据库。

在 `writing/entries.json` 的 `collections` 添加有实际作品的分组，再在 `entries` 登记条目。数组顺序就是目录顺序。每个条目提供唯一 `id`、`title`、`collection` 和 `status`。回应还需要 `source.title` 与 `source.url`，标题必须相同。

回应有自己的标题时，填写可选的 `responseTitle`，它用于阅读页 H1 和浏览器标题。`title` 仍保留原文标题，供目录与固定 URL 使用；不把回应标题重复写进 Markdown 正文。

长文在作者允许时可填写 `toc: true`：正文前生成默认收起的简洁目录，只列主要 H2。公式用 `$...$`，独立公式起止 `$$` 各占一行；构建器输出原生 MathML。具体格式见文字规范第 4.3–4.4 节。

`pending` 条目不填写正文、作者署名或发布日期。待写页面可以通过 `/ai-lab/writing/bluenote/布涅星/` 等原标题地址访问，且不允许搜索引擎索引。

填写正文时：

1. 将已经审阅的 Markdown 放到 `writing/bodies/`；正文不含页面标题和返回导航，模板会生成它们。需要来源时使用语义 ID 的 `[^scene]` 与对应定义，由构建器生成上标、注释和返回链接；可选的 `## 延伸阅读` 会排在注释之后。
2. 设置 `body` 为 `bodies/文件名.md`，填写实际发布日期 `published`（YYYY-MM-DD），将 `status` 改成 `published`。有明确署名时填写 `byline`，按实际记录 AI 生成与作者编辑；未提供时省略该字段，不猜测作者或模型名称，也不因此暂停发布。
3. 运行 `npm run check`。空正文、重复地址、非法原文链接、原文标题不一致、缺失/重复/空/未使用/嵌套注释或无效片段链接会使检查失败。
4. 预览 `/ai-lab/`、`/ai-lab/writing/` 和单篇 URL，并验证原文、注释及每个引用位置的往返。按文字规范检查窄屏、明暗主题与键盘操作。先发布 AI Lab 对应页，再在 Blue Note 添加文末链接。
5. 作者已于 2026-09-05 授权后续请求的站点与内容更新通过检查后直接上线：提交并推送到 `main`，确认 GitHub Actions 成功和线上页面正确，无需再次询问发布确认。若作者明确要求仅预览或保留草稿，则遵循当次要求。

`draft` 条目不生成页面或目录链接，但公开仓库内的源文件仍然公开。正文支持 Markdown 与可信的手写 HTML；相对图片／附件必须指向最终页面能访问的本站资源，校验器会检查本地链接。

分类、条目元数据和 Markdown 不直接复制到站点。只输出生成页面与 `site/` 的公共资源。原有 `experiments/` 继续使用独立的 `project.json` 和 `public/`。
