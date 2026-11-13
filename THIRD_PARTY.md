# 来源与致谢

- **[Neko0] Iwara functional enhancements / [Neko0] Iwara 增强**，作者 JoJunIori，公开源码版本 1.3.0。
  - https://github.com/nekozero/neko0-web-tools/blob/master/automation/iwara.js
  - 源码声明 AGPL-3.0-or-later。本项目保留作者署名并采用相同许可证。
  - 对应能力：命名格式、复制、喜欢关注下载、Source 选择、画质检测和封面入口。
- **Theatre for iwara**，Sleazy Fork 发布者 xymopen，版本 1.1；源码 author 字段为 `-`，未标明许可证。
  - https://sleazyfork.org/zh-CN/scripts/543437-theatre-for-iwara/code
  - 本项目没有复制或分发该脚本代码及其 Webpack Hacks 依赖。影院布局、控制按钮和回收逻辑为独立实现，仅参考其功能与兼容的本地偏好键 `player-theatre`。

此项目不是原作者发布的官方合并版本。公开源码获取于 2026-11-11（America/New_York）。

## 图标与开发依赖

- Iwara 图标：引用 https://www.iwara.tv/logo.png ，仅用于标识脚本所服务的网站；该图标及 Iwara 商标不纳入本项目代码许可证，不主张其所有权或官方背书。
- jsdom：MIT，https://github.com/jsdom/jsdom ，仅用于开发测试。
- Playwright：Apache-2.0，https://github.com/microsoft/playwright ，仅用于开发测试。
- 开发依赖及其传递依赖的许可证保留在各自 npm 包中；本仓库不将 node_modules 打包为脚本运行依赖。
