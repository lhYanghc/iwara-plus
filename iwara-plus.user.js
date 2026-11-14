// ==UserScript==
// @name         Iwara Plus — Enhancements & Theatre
// @name:zh-CN   Iwara Plus — 增强与影院融合版
// @name:ja      Iwara Plus — 拡張機能とシアターモード
// @namespace    iwara-plus
// @version      1.0.13
// @author       lhYanghc
// @homepageURL  https://github.com/lhYanghc/iwara-plus
// @supportURL   https://github.com/lhYanghc/iwara-plus/issues
// @downloadURL  https://raw.githubusercontent.com/lhYanghc/iwara-plus/main/iwara-plus.user.js
// @updateURL    https://raw.githubusercontent.com/lhYanghc/iwara-plus/main/iwara-plus.meta.js
// @icon         https://www.iwara.tv/logo.png
// @description  Native-style Iwara enhancements: responsive theatre, filename copying, Source downloads, and playback quality estimates.
// @description:zh-CN 复制命名、喜欢关注下载、原画、画质检测与可记忆的影院模式
// @description:ja ファイル名のコピー、元画質のダウンロード、画質情報の表示とシアターモード。
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
  const translations = {
    '复制名字': { en: 'Copy filename', ja: 'ファイル名をコピー' },
    '下载原画': { en: 'Download Source', ja: '元画質でダウンロード' },
    '复制＋喜欢＋关注＋下载': { en: 'Copy, like, follow and download', ja: 'コピー・いいね・フォロー・ダウンロード' },
    '打开封面': { en: 'Open cover image', ja: 'カバー画像を開く' },
    '自动原画': { en: 'Prefer Source quality', ja: '元画質を優先' },
    '视频数据': { en: 'Video statistics', ja: '動画の統計' },
    '增强功能': { en: 'Enhancements', ja: '拡張機能' },
    '展开增强功能': { en: 'Show enhancements', ja: '拡張機能を表示' },
    '收起增强功能': { en: 'Hide enhancements', ja: '拡張機能を閉じる' },
    '选择要复制的名称': { en: 'Choose a filename to copy', ja: 'コピーするファイル名を選択' },
    '自动播放': { en: 'Autoplay', ja: '自動再生' },
    '自动播放：开启': { en: 'Autoplay on', ja: '自動再生オン' },
    '自动播放：关闭': { en: 'Autoplay off', ja: '自動再生オフ' },
    '切换影院模式': { en: 'Toggle theatre mode', ja: 'シアターモードを切り替える' },
    '进入影院模式': { en: 'Enter theatre mode', ja: 'シアターモードにする' },
    '退出影院模式': { en: 'Exit theatre mode', ja: 'シアターモードを終了' },
    '作品标题尚未加载': { en: 'Video title has not loaded yet', ja: '動画タイトルはまだ読み込まれていません' },
    '作者尚未加载': { en: 'Author has not loaded yet', ja: '投稿者はまだ読み込まれていません' },
    '上传日期尚未加载，请稍后重试': { en: 'Upload date has not loaded yet. Try again shortly.', ja: '投稿日を読み込み中です。しばらくしてからお試しください。' },
    '等待视频画质信息': { en: 'Waiting for video quality information', ja: '画質情報を待っています' },
    '帧率待播放检测': { en: 'Play to estimate frame rate', ja: '再生するとフレームレートを推定します' },
    '播放估算': { en: 'playback estimate', ja: '再生時の推定値' },
    '已复制：{name}': { en: 'Copied: {name}', ja: 'コピーしました：{name}' },
    '未找到 Source 下载链接，请先展开网站下载菜单后重试': { en: 'Source link unavailable. Open the site’s download menu and try again.', ja: '元画質のリンクがありません。サイトのダウンロードメニューを開いて再試行してください。' },
    '已请求下载原画（文件保存由浏览器处理）': { en: 'Source download requested. Your browser handles saving.', ja: '元画質のダウンロードを開始しました。保存はブラウザーで行います。' },
    '已复制：{name}；已请求下载；喜欢/关注仅对可识别的未选中按钮发出操作，请以网站结果为准': { en: 'Copied: {name}. Download requested. Like and follow were requested for recognized inactive buttons. Check their status on the site.', ja: 'コピーしました：{name}。ダウンロードを要求しました。未選択と判別できた場合のみ、いいね・フォローを要求しました。結果はサイトで確認してください。' },
    '未找到封面地址': { en: 'Cover image URL unavailable', ja: 'カバー画像のURLが見つかりません' },
    '上传日期暂不可用，作者命名和影院功能仍可使用': { en: 'Upload date unavailable. Author-based filenames and theatre mode are still available.', ja: '投稿日を取得できません。投稿者名を使ったファイル名とシアターモードは利用できます。' },
  };
  function siteLanguage() {
    let selected;
    try { selected = localStorage.getItem('locale'); } catch { /* Storage may be disabled. */ }
    const lang = (selected || document.documentElement?.lang || navigator.language || 'en').toLowerCase().split('-')[0];
    return ['zh', 'ja'].includes(lang) ? lang : 'en';
  }
  let language = siteLanguage();
  function translate(key, name = '') {
    const text = translations[key]?.[language] || key;
    return text.replace('{name}', () => name);
  }
  function localize(node, property, key) {
    node[property] = translate(key);
    node.dataset['iwp' + property[0].toUpperCase() + property.slice(1)] = key;
  }
  const settings = { type: 'name', theatre: true, source: true, autoplay: false, ...load('iwp-settings', {}) };
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
    .page-video__player, .page-video__player .video-js {-webkit-user-select:none;user-select:none}
    .video-js .iwp-autoplay,.video-js .iwp-theatre-toggle {display:grid;place-items:center;padding:0;cursor:pointer}
    .video-js .iwp-autoplay {width:40px}
    .iwp-autoplay .iwp-switch-track {display:block;width:34px;height:18px;fill:#535961;stroke:#70767b}
    .iwp-autoplay[aria-pressed="true"] .iwp-switch-track {fill:#81cba6;stroke:#a1ddbe}
    body.dark .iwp-autoplay[aria-pressed="true"] .iwp-switch-track {fill:#80b9f5;stroke:#afd5ff}
    body.dark .iwp-play-mark {fill:#163b62}
    .iwp-switch-thumb {transition:transform .15s}
    .iwp-autoplay[aria-pressed="true"] .iwp-switch-thumb {transform:translateX(16px)}
    .iwp-autoplay[aria-pressed="false"] .iwp-play-mark,.iwp-autoplay[aria-pressed="true"] .iwp-pause-mark {display:none}
    .iwp-autoplay:focus-visible {outline:2px solid currentColor;outline-offset:-2px}
    .iwp-theatre-toggle svg {display:block;width:21px;height:21px}
    @media(prefers-reduced-motion:reduce){.iwp-switch-thumb{transition:none}}
  `;

  let current = null;
  let queued = false;
  let suspended = false;
  const videoId = () => location.pathname.match(/^\/video\/([^/]+)/)?.[1] || null;
  let playbackId;
  let blockStartup;
  let startupVideo;
  let surfaceClick;
  function cancelSurfaceClick() {
    clearTimeout(surfaceClick);
    surfaceClick = null;
  }
  function syncPlaybackRoute() {
    const id = videoId();
    if (id !== playbackId) {
      playbackId = id;
      cancelSurfaceClick();
      blockStartup = !settings.autoplay;
      startupVideo = null;
    }
    return id;
  }
  // Only release the startup guard if the site's keyboard handler actually starts media.
  function observeNativePlayback(event) {
    if (!event.isTrusted || !syncPlaybackRoute() || !blockStartup) return;
    const video = $('.page-video__player video');
    if (video && !video.paused) blockStartup = false;
  }
  for (const type of ['keydown', 'keyup']) window.addEventListener(type, observeNativePlayback);
  function handlePlayerInput(event) {
    if (!event.isTrusted || !syncPlaybackRoute()) return;
    const target = event.target;
    const player = target.closest?.('.page-video__player');
    if (!player) return;
    const playControl = target.closest('.vjs-big-play-button, .vjs-play-control');
    if (event.button !== 0) return;
    if (playControl && (event.detail === 0 || playControl.matches('.vjs-play-control'))) {
      cancelSurfaceClick();
      blockStartup = false;
      return;
    }
    if (target.closest('.vjs-control-bar, .vjs-menu, .vjs-modal-dialog, a, input, select') ||
        (!playControl && target.closest('button, [role="button"], [role="slider"]'))) return;
    const video = $('video', player);
    if (!video || video.controls || !(target === player || target.closest('.video-js, .videoPlayer, video'))) return;
    // Selection starts on the second press, before the dblclick event.
    if (event.type === 'mousedown') {
      if (event.detail > 1) event.preventDefault();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    cancelSurfaceClick();
    if (event.type === 'dblclick') {
      const fullscreen = $('.vjs-fullscreen-control', player);
      if (fullscreen) fullscreen.click();
      else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else player.requestFullscreen?.().catch(() => {});
      return;
    }
    // A spinner or poster click is consumed here, so Video.js never receives
    // its usual opportunity to take keyboard focus. Focus during the gesture
    // so a later buffering callback cannot steal focus from another field.
    const keyboardTarget = video.closest('.video-js') || video;
    if (!keyboardTarget.hasAttribute('tabindex')) keyboardTarget.tabIndex = -1;
    keyboardTarget.focus({ preventScroll: true });
    // Give a second click time to claim the gesture before toggling playback.
    const id = playbackId;
    surfaceClick = setTimeout(() => {
      surfaceClick = null;
      if (id !== videoId() || !player.isConnected) return;
      const media = $('video', player);
      if (!media) return;
      blockStartup = false;
      const control = $('.vjs-play-control', player);
      if (control) control.click();
      else if (media.paused) media.play().catch(() => {});
      else media.pause();
    }, 500);
  }
  for (const type of ['mousedown', 'click', 'dblclick']) document.addEventListener(type, handlePlayerInput, true);
  function holdPlayback(video) {
    if (!syncPlaybackRoute() || !blockStartup) return;
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
    if (text && Object.hasOwn(translations, text)) localize(node, 'textContent', text);
    else if (text) node.textContent = text;
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'aria-label' && Object.hasOwn(translations, value)) localize(node, 'ariaLabel', value);
      else if (key === 'title' && Object.hasOwn(translations, value)) localize(node, 'title', value);
      else node.setAttribute(key, value);
    }
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
      catch (error) { text = translate(error.message); disabled = true; }
      if (option.textContent !== text) option.textContent = text;
      if (option.disabled !== disabled) option.disabled = disabled;
    }
  }
  function report(ctx, key, name) {
    if (ctx !== current) return;
    ctx.lastReport = [key, name];
    const message = translate(key, name);
    if (ctx.status.textContent !== message) ctx.status.textContent = message;
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
    const focused = document.activeElement;
    const restoreFocus = focused && ctx.player.contains(focused);
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
    if (restoreFocus && focused.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
    ctx.control?.setAttribute('aria-pressed', String(settings.theatre));
    if (ctx.control) localize(ctx.control, 'title', settings.theatre ? '退出影院模式' : '进入影院模式');
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
      return kind === 'like' ? Boolean($('.fa-heart', b)) : Boolean($('.fa-check, .fa-user-plus, .fa-heart', b)) && !/unfollow|取消关注|已关注|フォロー解除|フォロー中/i.test(b.textContent);
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
      const value = w && h ? `${w} × ${h}${fps ? ` · ≈${fps} fps (${translate('播放估算')})` : ` · ${translate('帧率待播放检测')}`}` : translate('等待视频画质信息');
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
    ctx.updateQuality = update;
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
      ctx.control.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
      ctx.control.addEventListener('click', () => toggle(ctx));
    }
    if (bar && !ctx.autoplayControl?.isConnected) {
      const button = element('button', '', { type: 'button', class: 'vjs-control vjs-button iwp-autoplay', 'aria-label': '自动播放' });
      button.innerHTML = `<svg class="iwp-switch-track" viewBox="0 0 34 18" aria-hidden="true">
        <rect x=".5" y=".5" width="33" height="17" rx="8.5"/>
        <g class="iwp-switch-thumb" stroke="none">
          <circle cx="9" cy="9" r="7" fill="#fafbfc"/>
          <path class="iwp-pause-mark" fill="#3c4149" d="M6 6h2v6H6z M10 6h2v6h-2z"/>
          <path class="iwp-play-mark" fill="#184932" d="M7 5.5l6 3.5-6 3.5z"/>
        </g></svg>`;
      const refresh = () => {
        button.setAttribute('aria-pressed', String(settings.autoplay));
        localize(button, 'title', settings.autoplay ? '自动播放：开启' : '自动播放：关闭');
      };
      button.addEventListener('click', () => {
        settings.autoplay = !settings.autoplay;
        save();
        refresh();
      });
      ctx.autoplayControl = button;
      refresh();
    }
    if (bar) {
      // Video.js plugins may wrap controls or insert them after the bar mounts.
      const slot = selector => $(`:scope > :is(${selector}), :scope > :has(${selector})`, bar);
      const fullscreen = slot('.vjs-fullscreen-control');
      if (ctx.control.parentNode !== bar || ctx.control.nextElementSibling !== fullscreen)
        bar.insertBefore(ctx.control, fullscreen);
      const pip = slot('.vjs-picture-in-picture-control');
      const time = pip ? null : slot('.vjs-remaining-time') || slot('.vjs-duration') || slot('.vjs-current-time');
      const anchor = pip || (time ? time.nextElementSibling : ctx.control);
      if (anchor !== ctx.autoplayControl &&
          (ctx.autoplayControl.parentNode !== bar || ctx.autoplayControl.nextElementSibling !== anchor))
        bar.insertBefore(ctx.autoplayControl, anchor);
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
    old.autoplayControl?.remove();
  }
  function mount(id, player, details) {
    const ctx = { id, player, details, nativeActions: new Map(), nativeStats: new Map(), abort: new AbortController() };
    current = ctx;
    player.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey ||
          event.altKey || event.metaKey || event.shiftKey || ctx.id !== videoId()) return;
      const target = event.target;
      if (target !== document.activeElement || target.isContentEditable ||
          !target.matches('.video-js, video')) return;
      const key = event.key.toLowerCase();
      if (key === 't') {
        event.preventDefault();
        toggle(ctx);
      } else if (key === 'i') {
        const pip = $('.vjs-picture-in-picture-control', player);
        if (pip && !pip.disabled) {
          event.preventDefault();
          pip.click();
        }
      }
    }, { signal: ctx.abort.signal });
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
      localize(expand, 'ariaLabel', label);
      localize(expand, 'title', label);
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
    button(ctx, '复制名字', () => report(ctx, '已复制：{name}', copy()));
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
      report(ctx, '已复制：{name}；已请求下载；喜欢/关注仅对可识别的未选中按钮发出操作，请以网站结果为准', name);
    });
    button(ctx, '打开封面', () => {
      const video = $('video', ctx.player);
      const poster = $('.vjs-poster', ctx.player);
      const image = poster && ($('img', poster)?.src || getComputedStyle(poster).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]);
      const url = video?.poster || image;
      if (!url || !/^https?:/.test(url)) throw new Error('未找到封面地址');
      window.open(url, '_blank', 'noopener');
    });
    const label = element('label');
    label.append(element('span', '自动原画'));
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
    const nextLanguage = siteLanguage();
    if (language !== nextLanguage) {
      language = nextLanguage;
      if (current) {
        for (const node of all('[data-iwp-text-content], [data-iwp-title], [data-iwp-aria-label]')) {
          for (const property of ['textContent', 'title', 'ariaLabel']) {
            const key = node.dataset['iwp' + property[0].toUpperCase() + property.slice(1)];
            if (key) node[property] = translate(key);
          }
        }
        if (current.lastReport) report(current, ...current.lastReport);
        current.updateQuality?.();
      }
    }
    const id = syncPlaybackRoute();
    const player = $('.page-video__player');
    const details = $('.page-video__details');
    if (current && (current.id !== id || current.details !== details || !current.player.isConnected || !current.toolbar.isConnected || (player && player !== current.player))) dispose();
    const video = player && $('video', player);
    if (id && video && (startupVideo !== video || (video.autoplay && blockStartup))) {
      startupVideo = video;
      holdPlayback(video);
    }
    if (id && player && details) {
      if (!current) mount(id, player, details);
      else enhance(current);
    }
  }
  function schedule() {
    if (!suspended && !queued) { queued = true; queueMicrotask(sync); }
  }
  const observer = new MutationObserver(schedule);
  const observeOptions = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'autoplay', 'lang'] };
  observer.observe(document, observeOptions);
  window.addEventListener('popstate', schedule);
  window.addEventListener('urlchange', schedule);
  // Route changes may precede DOM updates; also works in isolated userscript worlds.
  let routeTimer = setInterval(schedule, 750);
  window.addEventListener('pagehide', () => {
    suspended = true;
    cancelSurfaceClick();
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
