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

test('browser: playlist controls cross page boundaries and reveal a collapsed queue at the right edge', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1.25 });
    await page.addInitScript({ content: script });
    const requested = [];
    const ids = ['one','two','three','four','five'];
    const createdAt = id => '2026-11-0' + (5 - ids.indexOf(id)) + 'T12:00:00Z';
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'api.iwara.tv') {
        const nativeRow = '<div class="playlist__item"><div class="playlist__item__info"><div class="text text--text text--bold">one</div><div class="username"><div class="text text--small">Author</div></div></div></div>';
        const html = fixture
          .replace('</style>', '.page-video__player{display:flex}.page-video__player>.playlist{flex:0 0 25%;min-width:0}.page-video__player>.videoPlayer{flex:1}.videoPlayer__bg{position:absolute;inset:0;z-index:10}.vjs-control-bar{position:relative;z-index:12}.playlist a{color:blue}.light .text--text{color:#222}.dark .text--text{color:#eee}.username .text--small{color:#888}</style>')
          .replace('<div class="videoPlayer">', '<div class="videoPlayer"><div class="videoPlayer__bg"></div>')
          .replace('</div>\n<div class="page-video__details">', '<div class="playlist"><div class="playlist__header"><div class="playlist__header__about"><div class="text text--small">5 个视频</div></div></div><div class="playlist__items">' + nativeRow + '</div></div></div>\n<div class="page-video__details">');
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
      }
      const number = Number(url.searchParams.get('page'));
      if (url.pathname.startsWith('/video/')) return route.fulfill({ json: { createdAt: createdAt(url.pathname.split('/').pop()) } });
      requested.push(number);
      const id = ids[number];
      const pageIds = number === 2 && requested.length === 3 ? ['two', id] : [id];
      return route.fulfill({ json: { page: number, limit: 1, count: ids.length,
        results: pageIds.map(id => ({ id, title: id, user: { name: 'Author' }, createdAt: createdAt(id) })) } });
    });
    await page.goto('https://www.iwara.tv/video/one?playlist=list');
    const links = page.locator('.iwp-queue-nav a');
    await page.locator('.iwp-queue-nav a[href]').waitFor();
    assert.equal(await links.first().getAttribute('href'), null);
    const position = page.locator('.iwp-queue-position');
    await page.getByText('1/5 个视频', { exact: true }).waitFor();
    assert.equal(await page.getByText('5 个视频', { exact: true }).isVisible(), false);
    assert.deepEqual(requested, [0, 1]);
    const list = page.locator('.playlist__items');
    for (const id of ids.slice(1)) {
      await list.dispatchEvent('scroll');
      await list.getByRole('link', { name: id }).waitFor();
    }
    assert.deepEqual(requested, [0, 1, 2, 3, 4]);
    assert.equal(await list.getByRole('link', { name: 'two Author' }).count(), 1);
    await list.evaluate(node => {
      node.style.cssText = 'height:40px;overflow-y:auto';
      node.scrollTop = node.scrollHeight;
    });
    for (let i = 0; i < 4; i++) await list.dispatchEvent('wheel', { deltaY: 120 });
    assert.deepEqual(requested, [0, 1, 2, 3, 4]);
    await list.hover();
    const refreshed = page.waitForEvent('console', msg => /up to date|列表已是最新/.test(msg.text()));
    await page.mouse.wheel(0, -800);
    await refreshed;
    assert.equal(await page.getByText(/up to date|列表已是最新/).count(), 0);
    assert.deepEqual(requested, [0, 1, 2, 3, 4, 0]);
    await list.evaluate(node => node.removeAttribute('style'));
    for (const theme of ['light', 'dark']) {
      const colors = await list.evaluate((node, theme) => {
        document.body.className = theme;
        return [...node.querySelectorAll('.playlist__item__info')].map(info =>
          [info.firstElementChild, info.lastElementChild.firstElementChild].map(el => getComputedStyle(el).color));
      }, theme);
      assert.deepEqual(colors[0], colors[1]);
    }
    const toggle = page.locator('.iwp-queue-toggle');
    for (const theatre of [false, true, false]) {
      if (theatre !== ((await page.locator('.iwp-theatre').count()) > 0)) await page.locator('.iwp-theatre-toggle').click();
      for (const [width, zoom, share] of [[1001, 1.25, 29.5], [1537, 0.9, 24.25], [1280, 1, 25]]) {
        await page.setViewportSize({ width, height: 720 });
        await page.evaluate(([zoom, share]) => {
          document.body.style.zoom = zoom;
          document.querySelector('.playlist').style.flexBasis = share + '%';
        }, [zoom, share]);
        const gap = await toggle.evaluate(button =>
          document.querySelector('.playlist').getBoundingClientRect().left - button.getBoundingClientRect().right);
        assert.ok(Math.abs(gap) < 0.05, 'sidebar gap at width ' + width + ', zoom ' + zoom + ': ' + gap);
        await toggle.click();
        const collapsedGap = await toggle.evaluate(button =>
          document.querySelector('.videoPlayer').getBoundingClientRect().right - button.getBoundingClientRect().right);
        assert.ok(Math.abs(collapsedGap) < 0.05, 'collapsed gap at width ' + width + ': ' + collapsedGap);
        await toggle.click();
      }
    }
    const edge = await toggle.boundingBox();
    await page.mouse.move(edge.x + 8, edge.y + 16);
    assert.equal(await toggle.evaluate(node => {
      const box = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), true);
    await toggle.click();
    await page.mouse.move(0, 0);
    assert.equal(await page.locator('.playlist').isVisible(), false);
    assert.equal(await toggle.evaluate(node => getComputedStyle(node).opacity), '1');
    await page.locator('video').evaluate(video => {
      const canvas = document.createElement('canvas');
      video.muted = true;
      video.srcObject = canvas.captureStream(10);
      canvas.getContext('2d').fillRect(0, 0, 10, 10);
      const play = document.createElement('button');
      play.className = 'vjs-play-control';
      play.textContent = 'Play';
      play.onclick = () => video.paused ? video.play() : video.pause();
      document.querySelector('.vjs-control-bar').prepend(play);
    });
    const waitForOpacity = opacity => page.waitForFunction(value =>
      getComputedStyle(document.querySelector('.iwp-queue-toggle')).opacity === value, opacity);
    for (const theatre of [false, true]) {
      if (theatre !== ((await page.locator('.iwp-theatre').count()) > 0)) await page.locator('.iwp-theatre-toggle').click();
      await page.locator('.vjs-play-control').click();
      await page.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').readyState >= 2);
      await waitForOpacity('0');
      const box = await toggle.boundingBox();
      await page.mouse.move(box.x + 16, box.y + 32);
      await waitForOpacity('1');
      await page.waitForFunction(() => {
        const opacity = Number(getComputedStyle(document.querySelector('.iwp-queue-toggle')).opacity);
        return opacity > 0 && opacity < 0.8;
      });
      await page.mouse.move(box.x + 15, box.y + 31);
      await waitForOpacity('1');
      await waitForOpacity('0');
      await page.mouse.move(box.x + 18, box.y + 30);
      await waitForOpacity('1');
      await page.mouse.move(0, 0);
      await waitForOpacity('0');
      await page.locator('.vjs-play-control').click();
      await waitForOpacity('1');
      assert.equal(await page.locator('video').evaluate(video => video.paused), true);
    }
    await page.locator('.video-js').evaluate(node => node.requestFullscreen());
    await toggle.click();
    const panel = page.locator('.playlist');
    await page.waitForFunction(() => document.fullscreenElement?.contains(document.querySelector('.iwp-fullscreen-list')));
    assert.equal(await panel.evaluate(node => {
      const rect = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(rect.left + 5, rect.top + 5));
    }), true);
    const side = await panel.boundingBox(), handle = await toggle.boundingBox();
    assert.ok(Math.abs(handle.x + handle.width - side.x) < 1);
    await toggle.click();
    await toggle.click();
    await page.evaluate(() => document.exitFullscreen());
    await page.locator('.page-video__player > .playlist:visible').waitFor();
    await toggle.click();
    await page.locator('.iwp-queue-nav a:last-child[href]').click();
    await page.waitForURL('**/video/two?playlist=list');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await page.locator('.iwp-queue-nav a:last-child[href]').click();
    await page.waitForURL('**/video/three?playlist=list');
    await page.locator('.iwp-queue-nav a:last-child[href]').click();
    await page.waitForURL('**/video/four?playlist=list');
    await page.locator('.iwp-queue-nav a:last-child[href]').click();
    await page.waitForURL('**/video/five?playlist=list');
    await page.locator('.iwp-queue-nav a[href]').waitFor();
    assert.equal(await position.textContent(), '5/5 个视频');
    assert.equal(await links.last().getAttribute('href'), null);
    await links.first().click();
    await page.waitForURL('**/video/four?playlist=list');
    await toggle.focus();
    await toggle.press('Enter');
    assert.equal(await page.locator('.playlist').isVisible(), true);
    ids[0] = 'new';
    const beforeRefresh = requested.filter(n => n === 0).length;
    await list.dispatchEvent('wheel', { deltaY: -120 });
    await list.getByRole('link', { name: 'new Author' }).waitFor();
    assert.equal(await list.locator('.playlist__item:visible').count(), 1);
    await list.dispatchEvent('wheel', { deltaY: -120 });
    assert.equal(requested.filter(n => n === 0).length, beforeRefresh + 1);
    await list.dispatchEvent('wheel', { deltaY: 120 });
    await list.getByRole('link', { name: 'two Author' }).waitFor();
    const mode = page.locator('.iwp-order');
    const initialModeLabel = await mode.getAttribute('title');
    await mode.click();
    await page.waitForFunction(() => document.querySelector('.iwp-queue-nav a:last-child')?.pathname === '/video/three');
    for (const [i, id] of [...ids].reverse().entries()) {
      if (i) await list.dispatchEvent('wheel', { deltaY: 120 });
      await list.getByRole('link', { name: id + ' Author' }).waitFor();
    }
    const titles = list.locator('.playlist__item:visible .playlist__item__info > :first-child');
    assert.deepEqual(await titles.allTextContents(), [...ids].reverse());
    ids[4] = 'last';
    await list.dispatchEvent('wheel', { deltaY: -120 });
    await list.getByRole('link', { name: 'last Author' }).waitFor();
    assert.deepEqual(await titles.allTextContents(), ['last']);
    await page.evaluate(() => sessionStorage.setItem('iwp-order:list:shuffle', '[3,4,2,0,1]'));
    await mode.click();
    await list.getByRole('link', { name: 'new Author' }).waitFor();
    const next = page.locator('.iwp-queue-nav button:last-child:enabled');
    await page.reload();
    await next.waitFor();
    assert.equal(await page.evaluate(() => sessionStorage.getItem('iwp-order:list:shuffle')), null);
    await page.evaluate(() => { Math.random = () => 0; });
    await next.click();
    await page.waitForURL('**/video/new?playlist=list');
    await next.waitFor();
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('video').dispatchEvent('ended');
    await page.waitForURL('**/video/last?playlist=list');
    await next.waitFor();
    await page.evaluate(() => { Math.random = () => 0.99; });
    await page.locator('.iwp-queue-nav button:first-child').click();
    await page.waitForURL('**/video/four?playlist=list');
    await mode.click();
    assert.equal(await mode.getAttribute('title'), initialModeLabel);
  } finally { await browser.close(); }
});
test('wrapped details leave space between the player and the first action button', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const html = fixture.replace('<div class="page-video__details">', '<section><div class="page-video__details">')
      .replace('</div></div></div>\n<aside', '</div></div></section></div>\n<aside');
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.addInitScript({ content: script });
    await page.goto('https://www.iwara.tv/video/one?playlist=list');
    const button = page.locator('#iwp-toolbar .likeButton');
    await button.waitFor();
    for (const width of [1280, 640]) {
      await page.setViewportSize({ width, height: 720 });
      for (let i = 0; i < 2; i++) {
        const gap = await button.evaluate(node => node.getBoundingClientRect().top -
          document.querySelector('.page-video__player').getBoundingClientRect().bottom);
        assert.ok(gap >= 8, 'player-to-button gap was ' + gap + 'px');
        await page.locator('.iwp-theatre-toggle').click();
      }
    }
  } finally { await browser.close(); }
});
test('theatre anchors the control bar and centers the video in a tall playlist window', async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const html = `<style>
      .page-video__player,.videoPlayer {display:flex}.videoPlayer {align-items:center;position:relative}
      .videoPlayer > div {width:100%;height:100%}.playlist {width:25%;height:100%;overflow:auto}
      .video-js {position:relative}.vjs-tech {position:relative;max-height:80vh}
      .vjs-control-bar {position:absolute;bottom:0;width:100%;height:30px}
    </style><div class="container-fluid"><div class="page-video__player"><div class="videoPlayer"><div>
      <div class="video-js"><video class="vjs-tech"></video><div class="vjs-control-bar"></div></div>
    </div></div><div class="playlist"></div></div><div class="page-video__details"></div></div>`;
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.addInitScript({ content: script });
    await page.goto('https://www.iwara.tv/video/one?playlist=list');
    const toggle = page.locator('.iwp-queue-toggle');
    await toggle.waitFor();
    for (const width of [1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      for (let state = 0; state < 2; state++) {
        const offsets = await page.evaluate(() => {
          const rect = selector => document.querySelector(selector).getBoundingClientRect();
          const frame = rect('.videoPlayer'), video = rect('video'), bar = rect('.vjs-control-bar');
          return [frame.bottom - bar.bottom, frame.top - video.top, frame.bottom - video.bottom,
            frame.left - video.left, frame.right - video.right, getComputedStyle(document.querySelector('video')).objectFit];
        });
        assert.deepEqual(offsets, [0, 0, 0, 0, 0, 'contain']);
        const rect = await toggle.boundingBox();
        await page.mouse.move(rect.x + 10, rect.y + 12);
        await toggle.click();
      }
    }
  } finally { await browser.close(); }
});
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
