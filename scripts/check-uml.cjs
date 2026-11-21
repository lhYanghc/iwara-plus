const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { version } = require('../package.json');

// Each topic must appear in both languages, even when several share a diagram type.
const topics = [
  ['classDiagram', 'Runtime structure', '运行结构'],
  ['sequenceDiagram', 'Video page lifecycle', '视频页生命周期'],
  ['stateDiagram-v2', 'Playback startup guard', '起播保护'],
  ['sequenceDiagram', 'Combined toolbar action', '工具栏一键操作'],
  ['sequenceDiagram', 'Playlist navigation', '播放列表导航'],
  ['sequenceDiagram', 'Fullscreen control visibility', '全屏控件显示'],
];

for (const [filename, titleIndex] of [['architecture.md', 1], ['architecture.zh-CN.md', 2]]) {
  const file = resolve(__dirname, '../docs', filename);
  const markdown = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const expected = new Map(topics.map(topic => [`Iwara Plus v${version} ${topic[titleIndex]}`, topic[0]]));
  for (const [, block] of markdown.matchAll(/^```mermaid\n([\s\S]*?)\n```$/gm)) {
    const header = block.match(/^---\ntitle: (.+)\n---\n([\w-]+)\n/);
    if (!header || expected.get(header[1]) !== header[2]) {
      throw new Error(`${filename}: unexpected diagram, type or version: ${header?.[1] ?? block.split('\n')[0]}`);
    }
    expected.delete(header[1]);
  }
  if (expected.size) throw new Error(`${filename}: missing ${[...expected.keys()].join(', ')}`);
}
