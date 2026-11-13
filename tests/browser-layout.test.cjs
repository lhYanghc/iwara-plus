const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require('playwright');
const script = readFileSync(join(__dirname, '../iwara-plus.user.js'), 'utf8');

// A local fixture models Iwara's content padding, capped fluid container, and
// 9/3-column grid. No requests are sent to the real site or the user's profile.
const fixture = `<!doctype html><html><head><style>
*{box-sizing:border-box}body{margin:0;font:14px Arial;background:#fff;color:#222}
body.dark{background:#202124;color:#eee}.content{display:flex;padding:60px 0 30px 74px}
body.menu-open .content{padding-left:260px}.container-fluid{display:flex;width:100%;max-width:1200px;padding:0 15px;margin:0 auto}
.row{display:flex;flex-wrap:wrap;width:100%;margin:0 -15px}.col-md-9{flex:0 0 75%;max-width:75%;padding:0 15px;min-width:0}
.col-md-3{flex:0 0 25%;max-width:25%;padding:0 15px;min-width:0}
.video-js{width:100%;height:300px;background:#111}.page-video__player{width:100%}.page-video__details{overflow-wrap:anywhere}
.button{padding:8px;border:0;background:#e1e3e6;color:#222;border-radius:4px}.dark .button{background:#383b40;color:#eee}
.inputField{background:#fff;color:#222;border:1px solid #999;padding:8px}.dark .inputField{background:#292b30;color:#eee}
.page-video__actions{display:flex;gap:8px}.stats{display:flex;gap:8px}
.stats__number{font-size:16px;font-weight:700;line-height:24px}
.vjs-control-bar{display:flex}.vjs-progress-control{flex:1}video{display:none}
@media(max-width:699px){.content,body.menu-open .content{padding-left:0}.col-md-9,.col-md-3{flex-basis:100%;max-width:100%}}
</style></head><body><section class="content"><div class="container-fluid"><div class="row">
<div class="col-md-9"><div class="page-video__player"><div class="videoPlayer"><div class="video-js"><video></video><div class="vjs-control-bar"><div class="vjs-progress-control"></div><button class="vjs-fullscreen-control">全屏</button></div></div></div></div>
<div class="page-video__details"><h1 class="text--h1">当前页面的视频标题</h1><div class="page-video__byline"><span class="username" title="作者">作者</span></div>
<div class="page-video__actions"><button class="button likeButton"><i class="fa-heart"></i>赞</button><button class="button">添加到</button><button class="button">下载</button><button class="button">分享</button></div>
<div class="stats"><div class="stats__number"><i class="fa-heart"></i>428</div><div class="stats__number"><i class="fa-eye"></i>6,744</div></div></div></div>
<aside class="col-md-3 page-video__sidebar">原始侧栏</aside></div></div></section></body></html>`;

test('browser: menu widths, reversible roll animation, and light/dark themes', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto('https://www.iwara.tv/video/layout-fixture/title');
    await page.evaluate(() => {
      window.GM_getValue = (_, fallback) => fallback;
      window.GM_setValue = () => {};
      window.GM_setClipboard = () => {};
      window.fetch = async () => ({ ok: true, json: async () => ({ createdAt: '2024-06-15T12:00:00Z' }) });
    });
    await page.addScriptTag({ content: script });
    const dimensions = () => page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, width: r.width, height: r.height, bottom: r.bottom }; };
      return { player: rect('.video-js'), content: rect('.content'), stage: rect('.iwp-theatre-stage'), reveal: rect('#iwp-reveal'), arrow: rect('#iwp-collapse-row'), viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, direction: getComputedStyle(document.querySelector('.content')).flexDirection };
    });
    for (const width of [1440, 1000, 600, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      let closedWidth;
      for (const menuOpen of [false, true]) {
        await page.evaluate(open => document.body.classList.toggle('menu-open', open), menuOpen);
        const d = await dimensions();
        assert.equal(d.overflow, false, `overflow at width ${width}, menu ${menuOpen}`);
        assert.equal(d.direction, 'row');
        assert.ok(d.player.x >= 0 && d.player.x + d.player.width <= width + 1);
        assert.ok(Math.abs(d.player.width - d.stage.width) < 1);
        assert.ok(Math.abs(d.player.height - Math.min(780, d.stage.width * 9 / 16)) < 1);
        if (!menuOpen) closedWidth = d.player.width;
        else if (width >= 700) assert.ok(d.player.width < closedWidth - 100);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const dark of [false, true]) {
      await page.evaluate(value => document.body.classList.toggle('dark', value), dark);
      const initial = await page.locator('.likeButton').evaluate(node => getComputedStyle(node).backgroundColor);
      await page.locator('.likeButton i').evaluate(node => { node.className = 'fa-heart-crack'; });
      assert.equal(await page.locator('.likeButton').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(229, 57, 53)');
      assert.equal(await page.locator('.likeButton').evaluate(node => getComputedStyle(node).color), 'rgb(255, 255, 255)');
      await page.locator('.likeButton i').evaluate(node => { node.className = 'fa-heart'; });
      assert.equal(await page.locator('.likeButton').evaluate(node => getComputedStyle(node).backgroundColor), initial);
    }
    await page.evaluate(() => document.body.classList.remove('dark'));
    await page.evaluate(() => { document.querySelector('#iwp-quality').textContent = '1920 × 1080 · ≈60 fps'; });
    const fonts = await page.evaluate(() => ['#iwp-quality', '.iwp-native-stats .stats__number'].map(selector => {
      const s = getComputedStyle(document.querySelector(selector)); return [s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight];
    }));
    assert.deepEqual(fonts[0], fonts[1]);
    await page.setViewportSize({ width: 390, height: 1000 });
    const narrow = await page.evaluate(() => {
      const group = document.querySelector('#iwp-video-data');
      const button = document.querySelector('.likeButton');
      return { together: group.contains(document.querySelector('#iwp-quality')) && group.contains(document.querySelector('.iwp-native-stats')),
        wrapped: group.getBoundingClientRect().top >= button.getBoundingClientRect().bottom,
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.equal(narrow.together, true); assert.equal(narrow.wrapped, true); assert.equal(narrow.overflow, false);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const before = await dimensions();
    assert.equal(before.reveal.height, 0);
    assert.equal(await page.locator('#iwp-quality').isVisible(), true);
    await page.click('#iwp-expand');
    await page.waitForTimeout(160);
    const during = await dimensions();
    assert.equal(await page.locator('#iwp-expand svg').evaluate(node => getComputedStyle(node).transform), 'matrix(1, 0, 0, 1, 0, 0)');
    await page.waitForTimeout(480);
    const expanded = await dimensions();
    assert.equal(await page.locator('#iwp-expand svg').evaluate(node => getComputedStyle(node).transform), 'matrix(1, 0, 0, -1, 0, 0)');
    assert.ok(during.reveal.height > 0 && during.reveal.height < expanded.reveal.height);
    assert.ok(expanded.arrow.x === before.arrow.x && expanded.arrow.bottom > before.arrow.bottom);
    assert.ok(expanded.arrow.bottom > expanded.reveal.bottom);
    await page.click('#iwp-expand'); await page.waitForTimeout(150);
    assert.equal(await page.locator('#iwp-expand svg').evaluate(node => getComputedStyle(node).transform), 'matrix(1, 0, 0, -1, 0, 0)');
    const closing = await dimensions();
    assert.ok(closing.reveal.height > 0 && closing.reveal.height < expanded.reveal.height);
    // Reverse midway instead of waiting for the first transition to finish.
    await page.click('#iwp-expand'); await page.waitForTimeout(420);
    assert.ok(Math.abs((await dimensions()).reveal.height - expanded.reveal.height) < 1);
    for (const dark of [false, true]) {
      await page.evaluate(value => document.body.classList.toggle('dark', value), dark);
      const colors = await page.evaluate(() => ({ text: getComputedStyle(document.querySelector('#iwp-extras')).color, input: getComputedStyle(document.querySelector('#iwp-extras select')).backgroundColor }));
      assert.equal(colors.text, dark ? 'rgb(238, 238, 238)' : 'rgb(34, 34, 34)');
      assert.equal(colors.input, dark ? 'rgb(41, 43, 48)' : 'rgb(255, 255, 255)');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.click('#iwp-expand');
    assert.equal((await dimensions()).reveal.height, 0);
  } finally { await browser.close(); }
});
