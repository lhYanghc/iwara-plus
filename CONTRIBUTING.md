# 参与贡献

欢迎提交问题、功能建议和 Pull Request。

## 开发

需要 Node.js 20.19+（建议 24）、pnpm 11.25.0 与 Chrome。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm test
pnpm build:meta
```

浏览器测试在临时无头 Chrome 会话中使用本地页面，拦截所有请求，不访问个人浏览器配置或真实 Iwara 内容。

修改脚本版本时，同时更新 package.json 与 CHANGELOG.md，并重新生成 iwara-plus.meta.js。
每次发布前，对照本版脚本逐张核对并同步更新[中文 UML](docs/architecture.zh-CN.md) 与[英文 UML](docs/architecture.md)。如果架构和流程没有变化，保留图的内容，将每张图标题中的版本号更新为本次发布版本。创建发布标签前运行 `pnpm check`，确认两种语言均包含全部图表，且版本与插件一致。
请保留原生网站 UI、可访问性、明暗主题和窄屏行为。提交截图时遮住账号信息和签名下载链接。

## 许可

提交的代码贡献采用本仓库的 AGPL-3.0-or-later 许可。无需签署额外 CLA。
请确保新增代码与素材允许在该许可下使用，并补充 THIRD_PARTY.md。
