# 根与冠：两棵树的美术制作记录

用户于 2026-09-13 选择第三轮预览 1 与 4 融合，预览 5 单独保留，要求两棵树沿页面向下展开，翻转后尽量保留枝条。

## 资产与来源

所有画面由内置 image_gen 生成。预览 5 沿用已选定原图；第一棵为 1 与 4 的融合图。两张根系由各自树冠定向编辑得到，生成时保持正向，网页统一旋转 180°。四张图均经过目视比对：主要分叉位置保持，末梢改为根须；不是逐像素一致的矢量几何。

- `public/assets/silver-crown.png`：第一棵树，融合预览 1 的结构与预览 4 的纹理。
- `public/assets/silver-roots.png`：第一棵树的根系。
- `public/assets/open-crown.png`：第三轮预览 5 原图，留白枝影。
- `public/assets/open-roots.png`：第二棵树的根系。

网站使用四张原始 PNG，保留细线；HTML 导出将图像嵌入，不依赖网络。每棵树使用独立交互状态。路径与节点在 1000 × 1000 坐标中配准，正反共用，分叉不合流。图像使用交叉渐变而非逐顶点形变。

## 第一棵树的融合提示词

Edit the first reference tree into the FINAL flat white-line tree illustration for a website. Reference image 1 is the exact composition and tree anatomy to preserve. Reference image 2 supplies only its fine distressed broken engraved line texture. Fuse the AIRY, spacious delicate branching of image 1 with the refined interrupted bark strokes and fine textured crown marks of image 2. Keep the same broad grand mature-tree proportions and silhouette as image 1, no thicker trunk. Keep the original black gaps and elegant naturally asymmetric branches. A very subtle luminous white ink edge, no atmospheric glow. Strictly TWO DIMENSIONAL white line drawing on an opaque pure black background. Flat line grain, no modeled bark or cylindrical shading, no realistic metal, no photographic foliage. Foliage remains tiny abstract curved and broken marks, not larger literal leaf icons. No 3D, no gradients, no gray fill or solid foliage masses. Whole tree fits in the square image, centered exactly like the first reference. No text, frame or extra objects. Preserve every major branch junction and its position from reference 1. Fine detailed final artwork.

## 两棵树的根系编辑提示词

Precisely edit this image to create its ROOT-SIDE counterpart for a tree that will rotate in a website. KEEP THIS IMAGE UPRIGHT EXACTLY AS IS: do not rotate, mirror, rescale or shift it. The website will rotate it later. Preserve the trunk and ALL major branches, their outlines, junctions, widths, positions, line texture, negative spaces and entire composition IDENTICALLY. This is the same tree structure, not a newly designed tree.

The ONLY change: replace all the small white foliage marks around the fine branch tips with elegant, extremely thin, tapering root hair strokes which extend from the EXISTING fine twigs. Remove leaf shapes. Root hairs are restrained, smooth or gently irregular, individually separate, a few slightly longer; they follow the outward branching direction of the existing tree. Keep the same overall airy broad silhouette and black openings. This is a dignified beautiful fine-lined root system when upside down. No additional large branches, no snarled tangled loops, no vines, no horror. Do not make the roots thick or swollen. Don't add soil, horizon or scenery.

Strictly FLAT TWO-DIMENSIONAL monochrome white ink drawing on opaque pure black. The grain and delicate luminous edge should match the input exactly; no 3D shading, no physical metal, no volumetric light. Preserve the trunk and principal branches with maximum fidelity. No labels.

## 第二棵树的树冠原始提示词

Use case: stylized-concept.
Create a sophisticated STRICTLY FLAT TWO-DIMENSIONAL graphic artwork for an interactive tree, white and silver-gray fine ink lines on pure black. The image is itself a drawing, viewed straight on, with ZERO depicted physical depth. A very large, graceful mature broadleaf tree, naturally proportioned trunk of moderate width, broad expansive crown, hundreds of connected tapering branches. Strong monumental scale from the expansive composition and intricate branching, not from an inflated trunk. Entire tree fills almost the whole square frame, with a little black breathing room.
Draw all branches spreading within ONE PLANE, like an exquisite planar botanical tracing. Trunk interiors remain black with flat white linear grain; line marks never wrap around cylinders. Abstract foliage is integrated into the line field as broken strokes and open fine tracery, no individually outlined leaf icons. Positive white marks and black gaps create texture without modeling volume. Every line is drawn in the same ink and equally sharp, with only an extremely restrained luminous fringe at selected line edges. Hierarchy through line WIDTH and spacing, never simulated depth.
Mood: mysterious, dignified, serene, elegant, beautiful. Inspired by the flat pale ornamental linework and quiet luminous marks of the original Frostpunk Book of Laws interface; invent an original tree, do not reproduce its UI layout or icons.
Absolute exclusions: 3D, photographic trees, realism, rendered metal, shiny silver cylinders, bark shading, engraved relief, bevels, highlights and shadows, cast shadows, directional lighting, atmosphere, fog, depth of field, foreground/background foliage layers, solid fluffy crown masses, twisted muscular trunk, horror, dead skeletal tree, bonsai, cartoon, childish leaf stickers, mandala, Celtic knots, symbols, gears, text, border. No surrounding scenery. Flat graphic richness, not realistic surface detail. Branches divide and do not rejoin.

Direction 5: NEGATIVE-SPACE BOTANICAL GRAPHIC. The most deliberately abstract and flat of these directions. A stately large tree made of fine pale-white outlines and a few narrow matte white branch strokes, surrounded by deep clean black. Large elegantly shaped black openings carve the broad crown into a coherent composition. Distribute many tiny disconnected white calligraphic ticks around the branching ends to suggest a living leafy crown without drawing literal leaves. Controlled fine granulated ink texture appears inside some strokes but NEVER forms tonal shading. No smooth white silhouette block, no generic tree logo. Asymmetric broad canopy, trunk is naturally proportioned and substantial enough for a mature tree, elegant organic branch paths with very few overlaps. All flat ink marks have a delicate restrained glow; no atmosphere.

## 参考与视觉边界

借鉴 Frostpunk 初代法典界面的平面细线、局部微光和克制纹饰。不复制其徽章、布局或蓝色效果。不引入金属体积、立体树皮、摄影树叶或前后树冠团块。

- https://interfaceingame.com/screenshots/frostpunk-book-of-laws/
- https://news.xbox.com/en-us/2021/07/21/how-the-visual-identity-of-frostpunk-changed/

## 验收记录

- `npm run check`：8 项现有测试通过，8 个页面与资源路径检查通过；内联交互脚本单独编译检查通过。
- 本地 `/ai-lab/experiments/narrative-tree/`：两棵树独立呈现，1280px 视口下每幅绘图区域约 1200px 高，页面自然向下展开。
- 实际鼠标拖拽：第一棵树翻转为根，第二棵仍为冠；第一棵放大至 1.35 倍后反向拖拽仍可翻回。移动模式平移及全貌复位通过。
- 节点：选中路径沿主干回溯，翻转后选择与路径保留；同一套节点与路径随整幅画面一起旋转。
- 键盘：第二棵树通过方向键从根翻回冠。
- 390px 与 320px 窄屏无页面和工具栏横向溢出；根系全貌与树冠均经过目视检查。此项为窄屏布局检查，不冒称真实触屏设备测试。
- 下载按钮成功完成四张图像嵌入，页面返回导出成功状态。未另行声称在无网络设备上打开过导出文件。
- 浏览器无 warning/error 日志；`git diff --check` 通过。
