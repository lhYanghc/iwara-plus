const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { JSDOM } = require('jsdom');
const script = readFileSync(require('node:path').join(__dirname, '../iwara-plus.user.js'), 'utf8');
const markup = `<div class="content"><div class="container-fluid"><div class="col-12">
<div class="page-video__player"><video></video><div class="vjs-control-bar"><div class="vjs-progress-control"></div><button class="vjs-fullscreen-control"></button></div><li class="vjs-menu-item resolution-Source"></li></div>
<div class="page-video__details"><h1 class="text--h1"></h1><div class="page-video__byline"><span class="username" title="Alice"></span></div><div class="page-video__byline__actions"><button id="follow"><i class="fa-check"></i></button></div><div class="page-video__actions"><button id="like"><i class="fa-heart"></i></button></div><div class="stats"><div class="stats__number"><i class="fa-heart"></i><span id="likes-count">428</span></div><div class="stats__number"><i class="fa-eye"></i>6,744</div></div><a href="https://files.iwara.tv/example.mp4">Source</a></div>
</div></div></div>`;
async function setup({ fail = false, saved, deferred = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://www.iwara.tv/video/first/title', runScripts: 'outside-only' });
  const w = dom.window;
  w.document.querySelector('h1').textContent = '<title>: test?';
  const counts = { source: 0, download: 0, like: 0, follow: 0 };
  w.document.querySelector('.resolution-Source').onclick = () => counts.source++;
  w.document.querySelector('a').onclick = e => { e.preventDefault(); counts.download++; };
  for (const kind of ['like', 'follow']) w.document.getElementById(kind).onclick = () => counts[kind]++;
  w.GM_getValue = (_, fallback) => saved || { theatre: false };
  w.GM_setValue = (_, value) => { counts.saved = value; };
  w.GM_setClipboard = text => { counts.copied = text; };
  w.fetch = () => deferred ? new Promise(() => {}) : fail ? Promise.reject(new Error('offline')) : Promise.resolve({ ok: true, json: async () => ({ createdAt: '2024-06-15T12:00:00Z' }) });
  w.eval(script);
  await tick();
  const click = async label => {
    if (!['影院模式', '退出影院'].includes(label) && w.document.querySelector('#iwp-extras')?.hasAttribute('inert')) {
      w.document.querySelector('#iwp-expand').click();
      await tick();
    }
    const button = ['影院模式', '退出影院'].includes(label) ? w.document.querySelector('.iwp-theatre-toggle') : [...w.document.querySelectorAll('#iwp-toolbar button')].find(b => b.textContent === label);
    assert.ok(button, `button ${label}`); button.click(); await tick();
  };
  return { dom, w, counts, click };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
test('UI does not wait for metadata and filenames are plain text and Windows safe', async () => {
  const { dom, w, counts, click } = await setup({ deferred: true });
  try {
    await click('复制名字');
    assert.equal(counts.copied, 'Alice - title test');
    assert.equal(w.document.querySelectorAll('#iwp-toolbar').length, 1);
    assert.equal(counts.source, 1);
    w.eval(script); await tick();
    assert.equal(w.document.querySelectorAll('#iwp-toolbar').length, 1);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('theatre restores exact player position and has one accessible control', async () => {
  const { dom, w, click } = await setup();
  try {
    const player = w.document.querySelector('.page-video__player');
    const parent = player.parentNode;
    await click('影院模式');
    assert.equal(player.parentNode.className, 'iwp-theatre-stage');
    assert.ok(player.parentNode.parentNode.classList.contains('container-fluid'));
    assert.equal(w.document.querySelector('.content').className, 'content');
    assert.equal(w.document.querySelectorAll('.iwp-theatre-toggle').length, 1);
    const control = w.document.querySelector('.iwp-theatre-toggle');
    assert.equal(control.parentNode.className, 'vjs-control-bar');
    assert.equal(control.previousElementSibling.className, 'vjs-progress-control');
    assert.equal(control.nextElementSibling.className, 'vjs-fullscreen-control');
    assert.equal(w.document.querySelector('#iwp-toolbar .iwp-theatre-toggle'), null);
    assert.ok(control.querySelector('.vjs-icon-square'));
    await click('退出影院');
    assert.equal(player.parentNode, parent);
    assert.equal(player.nextElementSibling.id, 'iwp-toolbar');
    assert.equal(w.document.querySelector('.iwp-theatre-parent'), null);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('displayed names equal copied names and update with format and current page text', async () => {
  const { dom, w, counts, click } = await setup();
  try {
    const select = w.document.querySelector('select');
    assert.equal(w.document.querySelector('#iwp-name'), null);
    assert.equal(select.options[0].textContent, 'Alice - title test');
    assert.ok(!select.options[3].disabled);
    select.value = 'date3'; select.dispatchEvent(new w.Event('change'));
    assert.match(select.selectedOptions[0].textContent, /^240615 - Alice - title test$/);
    await click('复制名字');
    assert.equal(counts.copied, select.selectedOptions[0].textContent);
    w.document.querySelector('h1').firstChild.data = 'New: title?';
    w.document.querySelector('.username').setAttribute('title', 'Bob');
    await tick();
    assert.equal(select.selectedOptions[0].textContent, '240615 - Bob - New title');
    await click('复制名字');
    assert.equal(counts.copied, select.selectedOptions[0].textContent);
    assert.ok([...w.document.querySelectorAll('#iwp-extras > button')].every(b => b.classList.contains('button--primary') && b.querySelector('.text--small')));
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('enhancements start collapsed, arrows toggle, and original counts remain outside the panel', async () => {
  const { dom, w } = await setup();
  try {
    const doc = w.document;
    const extras = doc.querySelector('#iwp-extras');
    const expand = doc.querySelector('#iwp-expand');
    const actions = doc.querySelector('.page-video__actions');
    const stats = doc.querySelector('.stats');
    assert.equal(extras.hasAttribute('inert'), true);
    assert.equal(extras.getAttribute('aria-hidden'), 'true');
    assert.equal(doc.querySelector('#iwp-reveal').nextElementSibling, expand.parentNode);
    assert.equal(expand.getAttribute('aria-expanded'), 'false');
    assert.equal(expand.querySelector('svg polyline').getAttribute('points'), '4,5 20,19 36,5');
    assert.equal(expand.querySelector('svg').getAttribute('aria-hidden'), 'true');
    assert.equal(expand.parentNode.id, 'iwp-collapse-row');
    assert.equal(stats.parentNode.id, 'iwp-video-data');
    assert.equal(stats.parentNode.parentNode, actions);
    assert.equal(doc.querySelector('#iwp-quality').parentNode, stats.parentNode);
    assert.equal(doc.querySelector('#iwp-quality').className, stats.querySelector('.stats__number').className);
    assert.equal(extras.contains(doc.querySelector('#iwp-quality')), false);
    assert.equal(extras.contains(stats), false);
    assert.equal(doc.querySelector('#iwp-name'), null);
    expand.click(); await tick();
    assert.equal(extras.hasAttribute('inert'), false);
    assert.equal(doc.querySelector('#iwp-reveal').dataset.expanded, 'true');
    assert.equal(extras.getAttribute('aria-hidden'), 'false');
    assert.equal(expand.getAttribute('aria-label'), '收起增强功能');
    assert.equal(expand.getAttribute('aria-expanded'), 'true');
    doc.querySelector('#likes-count').textContent = '429'; await tick();
    assert.equal(doc.querySelectorAll('.stats').length, 1);
    assert.ok(stats.textContent.includes('429'));
    expand.click(); await tick();
    assert.equal(extras.hasAttribute('inert'), true);
    assert.equal(doc.querySelector('#iwp-reveal').dataset.expanded, 'false');
    assert.equal(expand.getAttribute('aria-label'), '展开增强功能');
    expand.click();
    w.history.pushState({}, '', '/video/second/title'); w.dispatchEvent(new w.PopStateEvent('popstate')); await tick();
    assert.equal(doc.querySelector('#iwp-extras').hasAttribute('inert'), true);
    assert.equal(doc.querySelectorAll('.stats').length, 1);
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(stats.parentNode.className, 'page-video__details');
    assert.equal(stats.previousElementSibling, actions);
    assert.equal(doc.querySelector('#iwp-quality'), null);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('one-click skips already liked or followed states', async () => {
  const { dom, w, counts, click } = await setup();
  try {
    w.document.querySelector('#like i').className = 'fa-heart-crack';
    w.document.querySelector('#follow').setAttribute('aria-pressed', 'true');
    await click('复制＋喜欢＋关注＋下载');
    assert.equal(counts.like, 0); assert.equal(counts.follow, 0); assert.equal(counts.download, 1);
    w.document.querySelector('#like i').className = 'fa-heart';
    w.document.querySelector('#follow').removeAttribute('aria-pressed');
    await click('复制＋喜欢＋关注＋下载');
    assert.equal(counts.like, 1); assert.equal(counts.follow, 1);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('statistics arriving after the action row moved are also aligned and restored', async () => {
  const { dom, w } = await setup();
  try {
    const doc = w.document;
    doc.querySelector('.stats').remove();
    const late = doc.createElement('div'); late.className = 'stats';
    late.innerHTML = '<div class="stats__number"><i class="fa-heart"></i>500</div><div class="stats__number"><i class="fa-eye"></i>7000</div>';
    doc.querySelector('.page-video__details').append(late); await tick();
    assert.equal(late.parentNode.id, 'iwp-video-data');
    assert.equal(doc.querySelector('#iwp-extras').hasAttribute('inert'), true);
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(late.parentNode.className, 'page-video__details');
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('missing Source prevents partial one-click actions', async () => {
  const { dom, w, counts, click } = await setup();
  try {
    w.document.querySelector('a').remove();
    await click('复制＋喜欢＋关注＋下载');
    assert.equal(counts.like, 0); assert.equal(counts.follow, 0); assert.equal(counts.copied, undefined);
    assert.match(w.document.querySelector('#iwp-status').textContent, /未找到 Source/);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('metadata failure leaves copying and theatre functional', async () => {
  const { dom, w, counts, click } = await setup({ fail: true });
  try {
    await click('复制名字'); assert.ok(counts.copied);
    await click('影院模式'); assert.ok(w.document.querySelector('.iwp-theatre'));
    const select = w.document.querySelector('select'); select.value = 'date1'; select.dispatchEvent(new w.Event('change'));
    await click('复制名字'); assert.match(w.document.querySelector('#iwp-status').textContent, /上传日期尚未加载/);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('SPA navigation cleans up theatre, controls, and toolbar then remounts', async () => {
  const { dom, w, click } = await setup();
  try {
    await click('影院模式');
    w.history.pushState({}, '', '/videos'); w.dispatchEvent(new w.PopStateEvent('popstate')); await tick();
    assert.equal(w.document.querySelector('#iwp-toolbar'), null);
    assert.equal(w.document.querySelector('.iwp-theatre'), null);
    assert.equal(w.document.querySelector('.iwp-theatre-toggle'), null);
    w.history.pushState({}, '', '/video/second/title'); w.dispatchEvent(new w.PopStateEvent('popstate')); await tick();
    assert.equal(w.document.querySelectorAll('#iwp-toolbar').length, 1);
    assert.ok(w.document.querySelector('.iwp-theatre'));
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('portrait resolution is correctly marked and late video replacement is handled', async () => {
  const { dom, w } = await setup();
  try {
    const video = w.document.querySelector('video');
    Object.defineProperties(video, { videoWidth: { value: 1080 }, videoHeight: { value: 1920 } });
    video.dispatchEvent(new w.Event('loadedmetadata'));
    assert.equal(w.document.querySelector('#iwp-quality').dataset.low, 'false');
    const replacement = w.document.createElement('video');
    Object.defineProperties(replacement, { videoWidth: { value: 1280 }, videoHeight: { value: 720 } });
    video.replaceWith(replacement); await tick();
    assert.match(w.document.querySelector('#iwp-quality').textContent, /1280 × 720/);
    assert.equal(w.document.querySelector('#iwp-quality').dataset.low, 'true');
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});
test('diagram layout keeps full-width player above original two columns and actions above title', async () => {
  const { dom, w } = await setup({ saved: { theatre: true } });
  try {
    const doc = w.document;
    const main = doc.querySelector('.container-fluid');
    const sidebar = doc.createElement('aside'); sidebar.textContent = '点赞用户';
    main.append(sidebar);
    const toolbar = doc.querySelector('#iwp-toolbar');
    const actions = doc.querySelector('.page-video__actions');
    assert.equal(doc.querySelector('.page-video__player').parentNode.parentNode, main);
    assert.equal(toolbar.nextElementSibling.className, 'page-video__details');
    assert.equal(actions.parentNode, toolbar);
    assert.equal(sidebar.parentNode, main);
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(actions.parentNode.className, 'page-video__details');
    w.dispatchEvent(new w.Event('pageshow')); await tick();
    assert.equal(doc.querySelectorAll('#iwp-toolbar').length, 1);
    assert.equal(actions.parentNode.id, 'iwp-toolbar');
    assert.equal(sidebar.parentNode, main);
  } finally { dom.window.dispatchEvent(new dom.window.Event('pagehide')); dom.window.close(); }
});

