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

test('browser: holds playback until user activation for each video route', async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const page = await browser.newPage();
    await page.addInitScript({ content: script });
    await page.route('**/*', route => route.fulfill({
      contentType: 'text/html',
      body: '<div class="page-video__player"><video autoplay muted></video><button class="vjs-play-control" onclick="document.querySelector(\'video\').play()">Play</button></div>'
    }));
    await page.goto('https://www.iwara.tv/video/first/title');
    // A local media stream lets Chrome actually play without a network fixture.
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const video = document.querySelector('video');
      video.srcObject = canvas.captureStream(10);
      canvas.getContext('2d').fillRect(0, 0, 10, 10);
    });
    const tryAutoplay = () => page.evaluate(async () => {
      const video = document.querySelector('video');
      const attempted = new Promise(resolve => video.addEventListener('play', resolve, { once: true }));
      video.play().catch(() => {});
      await attempted;
      return video.paused;
    });
    assert.equal(await page.locator('video').getAttribute('autoplay'), null);
    assert.equal(await tryAutoplay(), true);
    await page.locator('button').click();
    await page.waitForFunction(() => !document.querySelector('video').paused);
    await page.evaluate(() => {
      document.querySelector('video').pause();
      history.pushState({}, '', '/video/second/title');
    });
    assert.equal(await tryAutoplay(), true);
    await page.locator('button').press('Enter');
    await page.waitForFunction(() => !document.querySelector('video').paused);
  } finally { await browser.close(); }
});

test('browser: buffered single clicks, fullscreen double clicks and saved autoplay', async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('locale', 'zh');
      window.GM_getValue = (_, fallback) => JSON.parse(localStorage.getItem('settings')) || fallback;
      window.GM_setValue = (_, value) => localStorage.setItem('settings', JSON.stringify(value));
    });
    const body = `<div class="page-video__player"><div class="video-js"><video muted></video>
      <div class="vjs-loading-spinner">Loading</div><button class="vjs-big-play-button">Play video</button>
      <div class="vjs-control-bar"><button class="vjs-play-control">Play/Pause</button>
      <button class="vjs-progress-control">Seek</button><span class="vjs-remaining-time">10:39</span>
      <button class="vjs-picture-in-picture-control">Picture in picture</button><button class="vjs-menu-button">Settings</button>
      <button class="vjs-fullscreen-control">Fullscreen</button></div>
      </div></div><div class="page-video__details"></div>`;
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body }));
    await page.goto('https://www.iwara.tv/video/one');
    async function mount() {
      await page.evaluate(() => {
        const video = document.querySelector('video');
        const canvas = document.createElement('canvas');
        window.draw = () => canvas.getContext('2d').fillRect(0, 0, 10, 10);
        video.srcObject = canvas.captureStream(10);
        window.toggles = 0;
        document.querySelector('.vjs-picture-in-picture-control').onclick = () => document.pictureInPictureElement ?
          document.exitPictureInPicture() : video.requestPictureInPicture();
        const toggle = () => {
          window.toggles++;
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        };
        for (const node of document.querySelectorAll('video, .vjs-play-control, .vjs-big-play-button')) node.onclick = toggle;
        document.querySelector('.vjs-fullscreen-control').onclick = () => document.fullscreenElement ?
          document.exitFullscreen() : document.querySelector('.video-js').requestFullscreen();
      });
      await page.addScriptTag({ content: script });
    }
    await mount();
    const spinner = page.locator('.vjs-loading-spinner');
    const bigPlay = page.locator('.vjs-big-play-button');
    const autoplay = page.getByRole('button', { name: '自动播放' });
    const paused = () => page.locator('video').evaluate(v => v.paused);
    assert.equal(await autoplay.getAttribute('aria-pressed'), 'false');
    const track = autoplay.locator('.iwp-switch-track');
    assert.deepEqual(await track.evaluate(node => {
      const { width, height } = node.getBoundingClientRect();
      return [width, height, getComputedStyle(node).fill];
    }), [34, 18, 'rgb(83, 89, 97)']);
    assert.equal(await page.locator('.vjs-remaining-time + .iwp-autoplay + .vjs-picture-in-picture-control + .vjs-menu-button + .iwp-theatre-toggle + .vjs-fullscreen-control').count(), 1);
    await spinner.click();
    await page.waitForFunction(() => window.toggles === 1);
    assert.equal(await paused(), false);
    await spinner.click();
    await page.waitForFunction(() => window.toggles === 2);
    await page.evaluate(() => window.draw());
    assert.equal(await paused(), true);
    await bigPlay.dblclick();
    await page.waitForFunction(() => document.fullscreenElement);
    assert.equal(await paused(), true);
    await spinner.click();
    await page.waitForFunction(() => window.toggles === 3);
    await page.evaluate(() => window.draw());
    await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.video-js')), true);
    await page.keyboard.press('i');
    await page.waitForFunction(() => document.pictureInPictureElement === document.querySelector('video'));
    await page.keyboard.press('i');
    await page.waitForFunction(() => !document.pictureInPictureElement);
    const theatre = page.getByRole('button', { name: '切换影院模式' });
    const before = await theatre.getAttribute('aria-pressed');
    await page.keyboard.press('t');
    assert.notEqual(await theatre.getAttribute('aria-pressed'), before);
    await page.keyboard.press('t');
    await page.keyboard.press('Shift+t');
    await page.locator('.vjs-progress-control').press('t');
    assert.equal(await theatre.getAttribute('aria-pressed'), before);
    await spinner.dblclick();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.evaluate(() => getSelection().toString()), '');
    await autoplay.click();
    await page.locator('.vjs-progress-control').click();
    assert.equal(await paused(), false);
    assert.equal(await page.evaluate(() => window.toggles), 3);
    await page.reload();
    await mount();
    assert.equal(await autoplay.getAttribute('aria-pressed'), 'true');
    assert.equal(await track.evaluate(node => getComputedStyle(node).fill), 'rgb(129, 203, 166)');
    await page.evaluate(() => {
      document.body.classList.add('dark');
      localStorage.setItem('locale', 'ja');
    });
    const japanese = page.getByRole('button', { name: '自動再生', exact: true });
    await japanese.waitFor();
    assert.equal(await japanese.getAttribute('title'), '自動再生オン');
    assert.equal(await japanese.locator('svg').evaluate(node => getComputedStyle(node).fill), 'rgb(128, 185, 245)');
    await page.evaluate(() => localStorage.setItem('locale', 'en'));
    await page.getByRole('button', { name: 'Autoplay', exact: true }).waitFor();
    assert.equal(await page.locator('#iwp-expand').getAttribute('title'), 'Show enhancements');
    await page.evaluate(() => localStorage.setItem('locale', 'zh'));
    await autoplay.waitFor();
    await page.evaluate(() => { document.querySelector('video').play().catch(() => {}); window.draw(); });
    await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
    assert.equal(await paused(), false);
    await autoplay.click();
    assert.equal(await paused(), false);
    await page.evaluate(() => history.pushState({}, '', '/video/two'));
    await page.waitForFunction(() => document.querySelector('video').paused);
  } finally { await browser.close(); }
});

test('browser: the site alone defines the player shortcuts and their focus scope', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto('https://www.iwara.tv/video/keys');
    await page.evaluate(() => {
      const root = document.querySelector('.video-js');
      root.tabIndex = -1;
      const video = root.querySelector('video');
      const canvas = document.createElement('canvas');
      video.srcObject = canvas.captureStream(10);
      window.draw = () => canvas.getContext('2d').fillRect(0, 0, 10, 10);
      // An arbitrary site-defined binding checks that the script has no key list.
      root.onkeydown = e => {
        if (e.key === 'p') { video.play().catch(() => {}); window.draw(); }
      };
      document.body.append(document.createElement('textarea'));
    });
    await page.addScriptTag({ content: script });
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    await page.keyboard.press('p');
    const root = page.locator('.video-js');
    const video = root.locator('video');
    await root.press('k');
    await root.press('Space');
    assert.equal(await video.evaluate(v => v.paused), true);
    // Unmapped keys must not unlock subsequent autoplay.
    assert.equal(await video.evaluate(async v => {
      const attempt = new Promise(resolve => v.addEventListener('play', resolve, { once: true }));
      v.play().catch(() => {});
      await attempt;
      return v.paused;
    }), true);
    await root.press('p');
    await page.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').readyState >= 2);
    await page.locator('textarea').fill('kmf');
    assert.equal(await page.locator('textarea').inputValue(), 'kmf');
  } finally { await browser.close(); }
});

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
