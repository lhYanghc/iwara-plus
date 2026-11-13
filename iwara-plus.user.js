// ==UserScript==
// @name         Iwara Plus — Enhancements & Theatre
// @name:zh-CN   Iwara Plus — 增强与影院融合版
// @namespace    iwara-plus
// @version      1.0.12
// @author       lhYanghc
// @homepageURL  https://github.com/lhYanghc/iwara-plus
// @supportURL   https://github.com/lhYanghc/iwara-plus/issues
// @downloadURL  https://raw.githubusercontent.com/lhYanghc/iwara-plus/main/iwara-plus.user.js
// @updateURL    https://raw.githubusercontent.com/lhYanghc/iwara-plus/main/iwara-plus.meta.js
// @icon         https://www.iwara.tv/logo.png
// @description  Native-style Iwara enhancements: responsive theatre, filename copying, Source downloads, and playback quality estimates.
// @description:zh-CN 复制命名、喜欢关注下载、原画、画质检测与可记忆的影院模式
// @match        https://www.iwara.tv/*
// @match        https://iwara.tv/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @run-at       document-start
// @noframes
// @license      AGPL-3.0-or-later
// ==/UserScript==

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 lhYanghc. Neko0 enhancements attribution: JoJunIori.
// Functional integration of JoJunIori's Neko0 Iwara enhancements and
// xymopen's Theatre for iwara. See THIRD_PARTY.md for source provenance.
(() => {
  'use strict';
  if (window.__iwaraPlusInstalled) return;
  window.__iwaraPlusInstalled = true;
  const $ = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const load = (key, fallback) => {
    try { return GM_getValue(key, fallback); } catch { return fallback; }
  };
  const settings = { type: 'name', theatre: true, source: true, ...load('iwp-settings', {}) };
  // Preserve Theatre's preference when no preference has been saved here yet.
  try {
    if (!load('iwp-settings', null) && localStorage.getItem('player-theatre') !== null) settings.theatre = true;
  } catch { /* Browser storage can be unavailable. */ }
  const save = () => GM_setValue('iwp-settings', { ...settings });
  const style = document.createElement('style');
  style.id = 'iwp-style';
  style.textContent = `
    #iwp-toolbar {display:flex;flex-wrap:wrap;align-items:center;gap:0;color:inherit;margin-bottom:10px}
    #iwp-reveal {display:grid;grid-template-rows:0fr;flex-basis:100%;width:100%;min-width:0;
      visibility:hidden;transition:grid-template-rows .36s ease,visibility 0s .36s}
    #iwp-reveal[data-expanded="true"] {grid-template-rows:1fr;visibility:visible;
      transition:grid-template-rows .36s ease,visibility 0s}
    #iwp-scroll-clip {min-height:0;overflow:hidden}
    #iwp-extras {display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;padding:8px 0;
      color:inherit;background:transparent;opacity:0;transform:translateY(-8px);
      transition:opacity .28s ease,transform .36s ease}
    #iwp-reveal[data-expanded="true"] #iwp-extras {opacity:1;transform:translateY(0)}
    #iwp-extras > button:disabled {opacity:.5;cursor:wait}
    #iwp-collapse-row {display:flex;justify-content:center;align-items:flex-start;gap:8px;flex-basis:100%;width:100%;color:inherit}
    #iwp-collapse-row::before,#iwp-collapse-row::after {content:'';flex:1;min-width:0;height:4px;
      margin-top:4px;border-radius:999px;background:currentColor;opacity:.65}
    #iwp-expand {display:flex;align-items:center;justify-content:center;flex:0 0 44px;min-width:44px;
      height:28px;min-height:28px;padding:0;border:0;background:transparent;color:inherit;cursor:pointer}
    #iwp-expand svg {display:block;width:36px;height:24px;transition:transform .28s ease .30s}
    #iwp-expand[aria-expanded="true"] svg {transform:scaleY(-1)}
    #iwp-expand:focus-visible {outline:2px solid currentColor;outline-offset:3px}
    @media(prefers-reduced-motion:reduce) {#iwp-expand svg,#iwp-reveal,#iwp-extras {transition:none}}
    #iwp-toolbar label {display:flex;gap:5px;align-items:center}
    #iwp-toolbar select {max-width:100%;min-width:0;font:inherit}
    #iwp-toolbar select option {color:inherit;background-color:inherit}
    #iwp-status {flex-basis:100%;font-size:12px;overflow-wrap:anywhere}
    #iwp-status:empty {display:none}
    #iwp-toolbar .iwp-native-actions {display:flex;flex-wrap:wrap;gap:8px;align-items:center;
      flex-basis:100%;width:100%;margin:0 0 8px}
    #iwp-video-data {display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:12px;
      margin-left:auto;order:100;flex:0 1 auto;min-width:0;max-width:100%}
    #iwp-toolbar .iwp-native-stats {display:flex;align-items:center;gap:12px;margin:0;
      flex:0 0 auto;white-space:nowrap}
    #iwp-quality {min-width:0;max-width:100%;overflow-wrap:anywhere}
    #iwp-quality[data-low="true"] {color:var(--red,red)}
    #iwp-toolbar .likeButton:is(:has(.fa-heart-crack),[aria-pressed="true"]) {
      background-color:var(--red,#e53935)!important;border-color:var(--red,#e53935)!important;color:#fff!important}
    #iwp-toolbar .likeButton:is(:has(.fa-heart-crack),[aria-pressed="true"]) :is(.text,.icon,svg) {color:inherit!important}
    .iwp-theatre-container {display:flex!important;flex-direction:column!important;
      width:100%!important;max-width:none!important;min-width:0;box-sizing:border-box}
    .iwp-theatre-stage {container-type:inline-size;flex:0 0 auto;width:100%;min-width:0;margin-bottom:16px}
    .iwp-theatre-container > .row {width:100%;max-width:var(--iwp-details-max-width,1200px);margin:0 auto;min-width:0}
    .iwp-theatre {width:100%!important;max-width:100%!important;min-width:0;margin:0!important}
    .iwp-theatre .videoPlayer {width:100%;min-width:0}
    .iwp-theatre .video-js {width:100%!important;height:min(78vh,56.25cqw)!important;min-height:0!important}
    .iwp-theatre video {object-fit:contain}
    .iwp-theatre-toggle {cursor:pointer}
  `;

  let current = null;
  let queued = false;
  let suspended = false;
  const videoId = () => location.pathname.match(/^\/video\/([^/]+)/)?.[1] || null;
  let playbackId;
  let manualPlayback = false;
  function syncPlaybackRoute() {
    const id = videoId();
    if (id !== playbackId) {
      playbackId = id;
      manualPlayback = false;
    }
    return id;
  }
  function recordPlayIntent(event) {
    if (!event.isTrusted || !syncPlaybackRoute()) return;
    const target = event.target;
    const player = target.closest?.('.page-video__player');
    if (!player) return;
    const playControl = target.closest('video, .vjs-big-play-button, .vjs-play-control, .vjs-poster');
    if (event.type === 'keydown') {
      if (event.repeat || ![' ', 'Enter', 'k', 'K'].includes(event.key)) return;
      if (!playControl && !target.matches('.video-js, .page-video__player')) return;
    } else if (event.button !== 0 || !playControl) return;
    manualPlayback = true;
  }
  for (const type of ['pointerdown', 'click', 'keydown']) document.addEventListener(type, recordPlayIntent, true);
  function holdPlayback(video) {
    if (!syncPlaybackRoute() || manualPlayback) return;
    video.removeAttribute('autoplay');
    if (!video.paused) video.pause();
  }
  for (const type of ['play', 'playing']) {
    document.addEventListener(type, event => {
      if (event.target.matches?.('.page-video__player video')) holdPlayback(event.target);
    }, true);
  }
  const element = (tag, text, attributes = {}) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  };
  const sanitize = text => text.replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
  function filename(ctx, type = settings.type) {
    const title = $('.page-video__details .text--h1')?.textContent.trim() || ctx.meta?.title;
    const user = $('.page-video__byline .username') || $('.page-video__details .username');
    const author = user?.getAttribute('title') || user?.textContent.trim() || ctx.meta?.user?.name || ctx.meta?.user?.username;
    if (!title) throw new Error('作品标题尚未加载');
    if (!author && ['name', 'date3', 'date4'].includes(type)) throw new Error('作者尚未加载');
    if (type === 'name') return sanitize(`${author} - ${title}`);
    const date = new Date(ctx.meta?.createdAt);
    if (Number.isNaN(date.getTime())) throw new Error('上传日期尚未加载，请稍后重试');
    const short = String(date.getFullYear()).slice(-2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    const long = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const prefix = ['date1', 'date3'].includes(type) ? short : long;
    return sanitize(`${prefix} - ${['date3', 'date4'].includes(type) ? author + ' - ' : ''}${title}`);
  }
  function refreshNames(ctx) {
    for (const option of ctx.nameSelect.options) {
      let text;
      let disabled = false;
      try { text = filename(ctx, option.value); }
      catch (error) { text = error.message; disabled = true; }
      if (option.textContent !== text) option.textContent = text;
      if (option.disabled !== disabled) option.disabled = disabled;
    }
  }
  function report(ctx, message) {
    if (ctx === current && ctx.status.textContent !== message) ctx.status.textContent = message;
  }
  function button(ctx, text, action) {
    const node = element('button', '', { type: 'button', class: 'button button--primary button--solid' });
    node.append(element('div', text, { class: 'text text--small' }));
    node.addEventListener('click', async () => {
      if (ctx !== current || node.disabled) return;
      node.disabled = true;
      try { await action(); } catch (error) { report(ctx, error.message); }
      finally { node.disabled = false; }
    });
    ctx.extras.append(node);
    return node;
  }
  function restore(ctx) {
    if (ctx.anchor?.parentNode && ctx.player.isConnected) ctx.anchor.after(ctx.player);
    ctx.player.classList.remove('iwp-theatre');
    ctx.main?.classList.remove('iwp-theatre-container');
    ctx.main?.style.removeProperty('--iwp-details-max-width');
    ctx.stage?.remove();
    ctx.stage = null;
    ctx.anchor?.remove();
    ctx.anchor = null;
  }
  function theatre(ctx) {
    if (settings.theatre) {
      const main = ctx.player.closest('.container-fluid');
      if (main?.parentNode && !ctx.anchor) {
        ctx.anchor = document.createComment('iwara-plus player position');
        ctx.player.before(ctx.anchor);
        ctx.main = main;
        const maxWidth = getComputedStyle(main).maxWidth;
        if (maxWidth && maxWidth !== 'none') main.style.setProperty('--iwp-details-max-width', maxWidth);
        ctx.stage = element('div', '', { class: 'iwp-theatre-stage' });
        main.prepend(ctx.stage);
        ctx.stage.append(ctx.player);
        main.classList.add('iwp-theatre-container');
      }
      ctx.player.classList.add('iwp-theatre');
    } else restore(ctx);
    ctx.control?.setAttribute('aria-pressed', String(settings.theatre));
    if (ctx.control) ctx.control.title = settings.theatre ? '退出影院模式' : '进入影院模式';
  }
  function toggle(ctx) {
    settings.theatre = !settings.theatre;
    save();
    theatre(ctx);
  }
  function downloadLink() {
    return all('#iwp-toolbar a, .page-video__bottom a, .page-video__details a, .dropdown__content a').find(a => /^source(?:\b|$)/i.test(a.textContent.trim()) && /^https?:/.test(a.href));
  }
  function positiveButton(root, kind) {
    if (!root) return null;
    // Act only on a recognized inactive icon, never toggle an active state off.
    return all('button', root).find(b => {
      if (b.disabled || b.getAttribute('aria-pressed') === 'true') return false;
      if ($('.fa-heart-crack, .fa-user-check', b)) return false;
      return kind === 'like' ? Boolean($('.fa-heart', b)) : Boolean($('.fa-check, .fa-user-plus, .fa-heart', b)) && !/unfollow|取消关注|已关注/i.test(b.textContent);
    });
  }
  function attachVideo(ctx, video) {
    ctx.videoCleanup?.();
    ctx.video = video;
    let handle;
    let previous;
    let samples = [];
    let fps = null;
    const update = () => {
      const w = video.videoWidth, h = video.videoHeight;
      const value = w && h ? `${w} × ${h}${fps ? ` · ≈${fps} fps（播放估算）` : ' · 帧率待播放检测'}` : '等待视频画质信息';
      if (ctx.quality.textContent !== value) ctx.quality.textContent = value;
      const low = String(Boolean(w && h && (Math.max(w, h) < 1920 || Math.min(w, h) < 1080)) || Boolean(fps && fps < 59));
      if (ctx.quality.dataset.low !== low) ctx.quality.dataset.low = low;
    };
    const reset = () => { previous = null; samples = []; fps = null; update(); };
    const frame = (_, meta) => {
      if (ctx !== current || ctx.video !== video) return;
      if (previous && !video.seeking && !video.paused && video.playbackRate === 1 && !document.hidden) {
        const frames = meta.presentedFrames - previous.presentedFrames;
        const seconds = meta.mediaTime - previous.mediaTime;
        if (frames > 0 && seconds > 0 && seconds < .5) {
          samples.push(seconds / frames);
          if (samples.length > 50) samples.shift();
          if (samples.length >= 20) { fps = Math.round(samples.length / samples.reduce((a, b) => a + b, 0)); update(); }
        }
      }
      previous = meta;
      handle = video.requestVideoFrameCallback(frame);
    };
    video.addEventListener('loadedmetadata', reset);
    video.addEventListener('seeking', reset);
    video.addEventListener('ratechange', reset);
    update();
    if (video.requestVideoFrameCallback) handle = video.requestVideoFrameCallback(frame);
    ctx.videoCleanup = () => {
      if (handle !== undefined) video.cancelVideoFrameCallback?.(handle);
      video.removeEventListener('loadedmetadata', reset);
      video.removeEventListener('seeking', reset);
      video.removeEventListener('ratechange', reset);
    };
  }
  function enhance(ctx) {
    refreshNames(ctx);
    // Move the existing action row, preserving its site event handlers. Keep the
    // details and the right sidebar in their original grid columns.
    const actions = $('.page-video__actions');
    if (actions) {
      const originalParent = ctx.nativeActions.get(actions)?.parentElement || actions.parentElement;
      const stats = all('.stats:not(.iwp-native-stats)', originalParent).find(node => $('.stats__number', node) && $('.fa-heart', node) && $('.fa-eye', node));
      if (stats && !actions.contains(stats)) {
        const anchor = document.createComment('iwara-plus stats position');
        stats.before(anchor);
        ctx.nativeStats.set(stats, anchor);
        stats.classList.add('iwp-native-stats');
        ctx.data.append(stats);
      }
    }
    if (actions && !ctx.toolbar.contains(actions)) {
      const anchor = document.createComment('iwara-plus actions position');
      actions.before(anchor);
      ctx.nativeActions.set(actions, anchor);
      actions.classList.add('iwp-native-actions');
      ctx.toolbar.prepend(actions);
    }
    // One flex item lets estimates and native counts wrap onto the next row together.
    if (actions && ctx.data.parentNode !== actions) actions.append(ctx.data);
    const number = $('.iwp-native-stats .stats__number', ctx.data);
    if (number && ctx.quality.className !== number.className) ctx.quality.className = number.className;
    const video = $('video', ctx.player);
    if (video && ctx.video !== video) attachVideo(ctx, video);
    const bar = $('.vjs-control-bar', ctx.player);
    if (bar && !ctx.control?.isConnected) {
      ctx.control = element('button', '', { type: 'button', class: 'vjs-control vjs-button iwp-theatre-toggle', title: settings.theatre ? '退出影院模式' : '进入影院模式', 'aria-label': '切换影院模式', 'aria-pressed': String(settings.theatre) });
      ctx.control.append(element('span', '', { class: 'vjs-icon-placeholder vjs-icon-square', 'aria-hidden': 'true' }), element('span', '影院模式', { class: 'vjs-control-text' }));
      ctx.control.addEventListener('click', () => toggle(ctx));
      const fullscreen = $('.vjs-fullscreen-control', bar);
      bar.insertBefore(ctx.control, fullscreen?.parentNode === bar ? fullscreen : null);
    }
    const source = $('.vjs-menu-item.resolution-Source', ctx.player);
    if (settings.source && source && ctx.sourceItem !== source) {
      ctx.sourceItem = source;
      if (!source.classList.contains('vjs-selected') && source.getAttribute('aria-checked') !== 'true') source.click();
    }
  }
  function dispose() {
    if (!current) return;
    const old = current;
    current = null;
    old.abort.abort();
    old.videoCleanup?.();
    old.quality.remove();
    restore(old);
    for (const [stats, anchor] of old.nativeStats) {
      if (anchor.parentNode && stats.isConnected) anchor.after(stats);
      stats.classList.remove('iwp-native-stats');
      anchor.remove();
    }
    old.data.remove();
    for (const [actions, anchor] of old.nativeActions) {
      if (anchor.parentNode && actions.isConnected) anchor.after(actions);
      actions.classList.remove('iwp-native-actions');
      anchor.remove();
    }
    old.toolbar.remove();
    old.control?.remove();
  }
  function mount(id, player, details) {
    const ctx = { id, player, details, nativeActions: new Map(), nativeStats: new Map(), abort: new AbortController() };
    current = ctx;
    ctx.toolbar = element('div', '', { id: 'iwp-toolbar', role: 'group', 'aria-label': 'Iwara Plus' });
    details.before(ctx.toolbar);
    ctx.reveal = element('div', '', { id: 'iwp-reveal', 'data-expanded': 'false' });
    const clip = element('div', '', { id: 'iwp-scroll-clip' });
    ctx.extras = element('div', '', { id: 'iwp-extras', inert: '', 'aria-hidden': 'true', role: 'group', 'aria-label': '增强功能' });
    clip.append(ctx.extras);
    ctx.reveal.append(clip);
    const collapseRow = element('div', '', { id: 'iwp-collapse-row' });
    const expand = element('button', '', { id: 'iwp-expand', type: 'button', 'aria-controls': 'iwp-extras', 'aria-expanded': 'false', 'aria-label': '展开增强功能', title: '展开增强功能' });
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 40 24');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.setAttribute('focusable', 'false');
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    for (const [key, value] of Object.entries({ points: '4,5 20,19 36,5', fill: 'none', stroke: 'currentColor', 'stroke-width': '6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) chevron.setAttribute(key, value);
    arrow.append(chevron);
    expand.append(arrow);
    expand.addEventListener('click', () => {
      const expanded = ctx.reveal.dataset.expanded !== 'true';
      ctx.reveal.dataset.expanded = String(expanded);
      ctx.extras.toggleAttribute('inert', !expanded);
      ctx.extras.setAttribute('aria-hidden', String(!expanded));
      expand.setAttribute('aria-expanded', String(expanded));
      const label = expanded ? '收起增强功能' : '展开增强功能';
      expand.setAttribute('aria-label', label);
      expand.title = label;
    });
    collapseRow.append(expand);
    ctx.toolbar.append(ctx.reveal, collapseRow);
    ctx.status = element('span', '', { id: 'iwp-status', role: 'status', 'aria-live': 'polite' });
    const select = element('select', '', { class: 'inputField', 'aria-label': '选择要复制的名称' });
    ctx.nameSelect = select;
    for (const value of ['name', 'date1', 'date2', 'date3', 'date4']) select.append(element('option', '', { value }));
    select.value = settings.type;
    select.addEventListener('change', () => { settings.type = select.value; save(); refreshNames(ctx); });
    ctx.extras.append(select);
    const copy = () => {
      const name = filename(ctx);
      GM_setClipboard(name, 'text');
      return name;
    };
    button(ctx, '复制名字', () => report(ctx, `已复制：${copy()}`));
    button(ctx, '下载原画', () => {
      const link = downloadLink();
      if (!link) throw new Error('未找到 Source 下载链接，请先展开网站下载菜单后重试');
      link.click(); report(ctx, '已请求下载原画（文件保存由浏览器处理）');
    });
    button(ctx, '复制＋喜欢＋关注＋下载', () => {
      const link = downloadLink();
      if (!link) throw new Error('未找到 Source 下载链接，请先展开网站下载菜单后重试');
      const name = copy();
      const liked = positiveButton($('.page-video__actions'), 'like');
      const followed = positiveButton($('.page-video__byline__actions'), 'follow');
      liked?.click(); followed?.click(); link.click();
      report(ctx, `已复制：${name}；已请求下载；喜欢/关注仅对可识别的未选中按钮发出操作，请以网站结果为准`);
    });
    button(ctx, '打开封面', () => {
      const video = $('video', ctx.player);
      const poster = $('.vjs-poster', ctx.player);
      const image = poster && ($('img', poster)?.src || getComputedStyle(poster).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]);
      const url = video?.poster || image;
      if (!url || !/^https?:/.test(url)) throw new Error('未找到封面地址');
      window.open(url, '_blank', 'noopener');
    });
    const label = element('label', '自动原画');
    const checkbox = element('input', '', { type: 'checkbox' });
    checkbox.checked = settings.source;
    checkbox.addEventListener('change', () => { settings.source = checkbox.checked; ctx.sourceItem = null; save(); enhance(ctx); });
    label.prepend(checkbox); ctx.extras.append(label);
    ctx.data = element('div', '', { id: 'iwp-video-data', role: 'group', 'aria-label': '视频数据' });
    ctx.quality = element('span', '', { id: 'iwp-quality', class: 'text stats__number text--bold' });
    ctx.data.append(ctx.quality);
    ctx.toolbar.prepend(ctx.data);
    ctx.extras.append(ctx.status);
    theatre(ctx); enhance(ctx);
    // Metadata enriches date formats; a failed request must never block the UI.
    fetch(`https://api.iwara.tv/video/${encodeURIComponent(id)}`, { signal: ctx.abort.signal })
      .then(response => { if (!response.ok) throw new Error('metadata'); return response.json(); })
      .then(meta => { if (ctx === current) { ctx.meta = meta; refreshNames(ctx); } })
      .catch(error => { if (error.name !== 'AbortError') report(ctx, '上传日期暂不可用，作者命名和影院功能仍可使用'); });
  }
  function sync() {
    queued = false;
    if (suspended) return;
    if (document.head && !style.isConnected) document.head.append(style);
    const id = syncPlaybackRoute();
    const player = $('.page-video__player');
    const details = $('.page-video__details');
    if (current && (current.id !== id || current.details !== details || !current.player.isConnected || !current.toolbar.isConnected || (player && player !== current.player))) dispose();
    const video = player && $('video', player);
    if (id && video) holdPlayback(video);
    if (id && player && details) {
      if (!current) mount(id, player, details);
      else enhance(current);
    }
  }
  function schedule() {
    if (!suspended && !queued) { queued = true; queueMicrotask(sync); }
  }
  const observer = new MutationObserver(schedule);
  const observeOptions = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'autoplay'] };
  observer.observe(document, observeOptions);
  window.addEventListener('popstate', schedule);
  window.addEventListener('urlchange', schedule);
  // Route changes may precede DOM updates; also works in isolated userscript worlds.
  let routeTimer = setInterval(schedule, 750);
  window.addEventListener('pagehide', () => {
    suspended = true;
    playbackId = null;
    observer.disconnect();
    clearInterval(routeTimer);
    dispose();
  });
  window.addEventListener('pageshow', () => {
    if (!suspended) return;
    suspended = false;
    observer.observe(document, observeOptions);
    routeTimer = setInterval(schedule, 750);
    schedule();
  });
  sync();
})();
