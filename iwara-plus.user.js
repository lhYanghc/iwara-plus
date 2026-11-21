// ==UserScript==
// @name         Iwara Plus — Enhancements & Theatre
// @name:zh-CN   Iwara Plus — 增强与影院融合版
// @name:ja      Iwara Plus — 拡張機能とシアターモード
// @namespace    iwara-plus
// @version      1.0.15
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
    '顺序播放': { en: 'Play in order', ja: '順番に再生' },
    '倒序播放': { en: 'Play in reverse', ja: '逆順再生' },
    '随机播放': { en: 'Shuffle', ja: 'シャッフル再生' },
    '正在刷新列表…': { en: 'Refreshing playlist…', ja: 'リストを更新中…' },
    '列表已是最新': { en: 'Playlist is up to date', ja: 'リストは最新です' },
    '列表已更新': { en: 'Playlist updated', ja: 'リストを更新しました' },
    '刷新失败，请再向上滚动重试': { en: 'Refresh failed. Scroll up to retry.', ja: '更新できませんでした。上にスクロールして再試行してください' },
    '上一个视频': { en: 'Previous video', ja: '前の動画' },
    '下一个视频': { en: 'Next video', ja: '次の動画' },
    '展开播放列表': { en: 'Show playlist', ja: 'プレイリストを開く' },
    '收起播放列表': { en: 'Hide playlist', ja: 'プレイリストを閉じる' },
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
    #iwp-toolbar {display:flex;flex-wrap:wrap;align-items:center;gap:0;color:inherit;padding-top:8px;margin-bottom:10px}
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
    .iwp-theatre-stage {container-type:inline-size;flex:0 0 auto;width:100%;min-width:0;margin-bottom:8px}
    .iwp-theatre-container > .row {width:100%;max-width:var(--iwp-details-max-width,1200px);margin:0 auto;min-width:0}
    .iwp-theatre {width:100%!important;max-width:100%!important;min-width:0;margin:0!important}
    .iwp-theatre .videoPlayer {width:100%;min-width:0}
    .iwp-theatre-container > .iwp-theatre .videoPlayer {container-type:inline-size}
    @media(min-width:768px){.iwp-theatre-container > .iwp-theatre .videoPlayer {flex:1}}
    .iwp-theatre .video-js {width:100%!important;height:min(78vh,56.25cqw)!important;min-height:0!important}
    .iwp-theatre .videoPlayer > div:has(> .video-js) {width:100%;height:auto}
    /* The queue can stretch the desktop player beyond its 16:9 content height. */
    @media(min-width:768px){
      .iwp-theatre:has(> .playlist) {height:80vh}
      .iwp-theatre:has(> .playlist) > .videoPlayer {height:100%}
      .iwp-theatre:has(> .playlist) > .videoPlayer > div:has(> .video-js) {width:100%;height:100%}
      .iwp-theatre:has(> .playlist) .video-js:not(.vjs-fullscreen) {height:100%!important}
    }
    .iwp-theatre .video-js.vjs-fullscreen {height:100%!important}
    .iwp-theatre .video-js video.vjs-tech {position:absolute;inset:0;width:100%;height:100%;max-height:none}
    .iwp-theatre video {object-fit:contain;object-position:center}
    .page-video__player, .page-video__player .video-js {-webkit-user-select:none;user-select:none}
    .iwp-queue-nav {display:contents}
    .playlist a.iwp-queue-item:any-link {color:inherit;text-decoration:none}
    .playlist__items.iwp-refreshed {display:flex;flex-direction:column}
    .playlist__items.iwp-queue-initializing {min-height:3rem}
    .iwp-refreshed > .playlist__item {flex:none;order:1}
    .iwp-refreshed > .iwp-stale-row,.iwp-queue-initializing > .playlist__item {display:none!important}
    .iwp-queue-position {font-variant-numeric:tabular-nums;white-space:nowrap}
    .playlist__header__about > .text:has(+ .iwp-queue-position:not(:empty)) {display:none}
    .iwp-queue-position:empty {display:none}
    .video-js .iwp-queue-nav .vjs-button {display:grid;place-items:center;color:inherit;text-decoration:none}
    .iwp-queue-nav svg {display:block;width:1.8em;height:1.8em;fill:currentColor}
    .iwp-queue-nav [aria-disabled="false"]:is(:hover,:focus-visible) svg {filter:drop-shadow(0 0 .18em currentColor)}
    .video-js .iwp-queue-nav [aria-disabled="true"] {color:#85898e;cursor:default}
    .page-video__player:has(.iwp-queue-toggle) {position:relative;column-gap:0}
    .page-video__player > .videoPlayer:has(~ .playlist) {position:relative;min-width:0}
    :is(.videoPlayer,.video-js):fullscreen .vjs-control-bar {position:fixed;inset:auto 0 0;width:100%;box-sizing:border-box}
    /* Video.js sets user-active on movement anywhere, including inside the list. */
    :is(.page-video__player:fullscreen,.page-video__player :fullscreen) .vjs-control-bar:not(.iwp-controls-awake):not(:has(:focus-visible)) {
      opacity:0!important;pointer-events:none!important;transition:none!important}
    :fullscreen .video-js:not(.vjs-controls-disabled) .iwp-controls-awake,
    .video-js:fullscreen:not(.vjs-controls-disabled) .iwp-controls-awake {
      display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;
      transition:none!important;z-index:19;color:#fff;background-color:rgba(26,31,38,.94)}
    :fullscreen .iwp-controls-awake:popover-open {position:fixed;inset:auto auto 0 0;
      width:calc(100% - var(--iwp-list-width,0px));margin:0;padding:0;border:0;overflow:visible;box-sizing:border-box}
    .iwp-controls-awake::backdrop {display:none}
    :fullscreen:has(.iwp-fullscreen-list) {--iwp-list-width:min(34vw,380px)}
    .playlist.iwp-fullscreen-list {position:fixed;inset:0 0 0 auto;z-index:20;box-sizing:border-box;cursor:auto;text-align:start;
      width:var(--iwp-list-width);min-width:0;max-width:none;height:auto;max-height:none;min-height:0;margin:0;padding:0;border:0;
      display:flex;flex-direction:column;background:var(--background,#202126);color:inherit}
    :fullscreen:has(.iwp-fullscreen-list) video.vjs-tech,
    :fullscreen:has(.iwp-fullscreen-list) .vjs-control-bar {position:fixed;left:0;right:auto;width:calc(100vw - var(--iwp-list-width))!important;box-sizing:border-box}
    :fullscreen:has(.iwp-fullscreen-list) .vjs-control-bar {top:auto;bottom:0}
    :fullscreen:has(.iwp-fullscreen-list) video.vjs-tech {top:0;height:100vh!important;object-fit:contain}
    :fullscreen:has(.iwp-fullscreen-list) .vjs-progress-control {min-width:0}
    .iwp-fullscreen-list > .playlist__items {min-height:0;overflow-y:auto}
    .page-video__player:has(.iwp-queue-toggle[aria-expanded="false"]) > .playlist {display:none}
    .page-video__player:has(.iwp-queue-toggle[aria-expanded="false"]) > .videoPlayer {width:100%;max-width:100%;flex:auto}
    /* Iwara's videoPlayer__bg captures surface clicks at z-index 10. */
    .iwp-queue-toggle {position:absolute;z-index:11;right:var(--iwp-edge,0px);top:var(--iwp-edge-y,50%);left:auto;bottom:auto;margin:0!important;transform:translateY(-50%);
      display:grid;place-items:center;width:32px;height:64px;padding:0;border:0;border-radius:8px 0 0 8px;
      background:#171318ce;color:white;cursor:pointer}
    @supports (right:anchor(--iwp-sidebar left)) {
      .page-video__player > .playlist {anchor-name:--iwp-sidebar}
      .page-video__player > .videoPlayer {anchor-name:--iwp-surface}
      .page-video__player > .iwp-queue-toggle {right:anchor(--iwp-surface right,var(--iwp-edge,0px));top:anchor(--iwp-surface center,var(--iwp-edge-y,50%))}
      .page-video__player > .iwp-queue-toggle.iwp-beside {right:anchor(--iwp-sidebar left,var(--iwp-edge,0px))}
    }
    .iwp-queue-toggle {opacity:1;transition:opacity 160ms ease-out}
    .iwp-queue-toggle svg {width:20px;height:20px;pointer-events:none}
    .iwp-queue-toggle[aria-expanded="false"] svg {transform:rotate(180deg)}
    .iwp-queue-toggle.iwp-playing:not(.iwp-near-edge):not(:focus-visible) {opacity:0;pointer-events:none;transition-duration:320ms}
    @media(prefers-reduced-motion:reduce){.iwp-queue-toggle {transition-property:none}}
    .playlist__header:has(> .iwp-order) {position:relative;padding-inline-end:44px}
    .iwp-order {position:absolute;inset-inline-end:0;top:0;bottom:0;width:40px;border:0;padding:0;
      display:grid;place-items:center;background:transparent;color:inherit;cursor:pointer}
    .iwp-order svg {width:20px;height:20px}
    .iwp-order:is(:hover,:focus-visible) {color:#f45b8e}
    .iwp-order:is(:hover,:focus-visible)::after {content:attr(aria-label);position:absolute;z-index:12;top:100%;right:0;
      background:#17181b;color:#fff;padding:5px 8px;border-radius:4px;font-size:12px;white-space:nowrap;pointer-events:none}
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
    if (target.closest('.playlist')) return;
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
    ctx.main = null;
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
      if (main?.parentNode && !ctx.main) {
        ctx.main = main;
        const maxWidth = getComputedStyle(main).maxWidth;
        if (maxWidth && maxWidth !== 'none') main.style.setProperty('--iwp-details-max-width', maxWidth);
        // Iwara replaces the inline player when the playlist request resolves.
        // Leave it in its native parent so the site can remove it during that render.
        if (!ctx.playlist) {
          ctx.anchor = document.createComment('iwara-plus player position');
          ctx.player.before(ctx.anchor);
          ctx.stage = element('div', '', { class: 'iwp-theatre-stage' });
          main.prepend(ctx.stage);
          ctx.stage.append(ctx.player);
        }
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
  function playlistPage(ctx, page, pages = ctx.pages) {
    if (!pages.has(page)) {
      const url = new URL('https://api.iwara.tv/playlist/' + encodeURIComponent(ctx.playlist));
      url.searchParams.set('page', page);
      pages.set(page, fetch(url, { signal: ctx.abort.signal, cache: 'no-store' }).then(async response => {
        if (!response.ok) throw new Error('Playlist unavailable');
        const data = await response.json();
        if (data.page !== page || !Array.isArray(data.results) || !(data.limit > 0)) throw new Error('Invalid playlist page');
        const results = data.results.map(({ id, title, user, file, thumbnail }) =>
          ({ id, title, author: user?.name, fileId: file?.id, thumbnail }));
        if (pages === ctx.pages) for (const video of results) ctx.knownPages.set(video.id, page);
        if (pages === ctx.pages && results.some(video => video.id === ctx.id)) {
          ctx.currentPage = page;
          if (ctx.deferredLookup) { ctx.queueLookup = null; schedule(); }
        }
        return { page, count: data.count, limit: data.limit, results };
      }).catch(error => { pages.delete(page); throw error; }));
    }
    return pages.get(page);
  }
  async function loadPlaylistOrder(ctx, pages, mode, locate = false) {
    let data = await playlistPage(ctx, ctx.currentPage ?? 0, pages);
    const last = Math.ceil(data.count / data.limit) - 1;
    if (ctx.currentPage == null && ctx.pageHint > 0 && ctx.pageHint <= last) {
      const hint = await playlistPage(ctx, ctx.pageHint, pages);
      if (hint.results.some(video => video.id === ctx.id)) data = hint;
    }
    if (last >= 8 && ctx.currentPage == null && !ctx.pendingStep && !locate) {
      await playlistPage(ctx, last, pages);
      if (ctx.currentPage == null && !ctx.pendingStep) return { deferred: true };
    }
    if (ctx.currentPage != null && ctx.currentPage !== data.page) data = await playlistPage(ctx, ctx.currentPage, pages);
    let index = data.results.findIndex(video => video.id === ctx.id);
    for (let page = 1; index < 0 && page <= last; page++) {
      if (ctx.pages !== pages || ctx.abort.signal.aborted || ctx.orderMode !== mode) return;
      if (last >= 8 && !ctx.pendingStep && !locate) return { deferred: true };
      data = await playlistPage(ctx, page, pages);
      index = data.results.findIndex(video => video.id === ctx.id);
    }
    if (index < 0 || ctx.pages !== pages || ctx.abort.signal.aborted) return;
    ctx.currentPage = data.page;
    const absolute = data.page * data.limit + index;
    const position = (mode === 1 ? data.count - absolute : absolute + 1) + '/' + data.count;
    if (mode === 2) return { position, randomSource: { absolute, count: data.count, limit: data.limit }, neighbors: [] };
    const prev = data.results[index - 1] || (data.page > 0 && (await playlistPage(ctx, data.page - 1, pages)).results.at(-1));
    const next = data.results[index + 1] || (data.page < last && (await playlistPage(ctx, data.page + 1, pages)).results[0]);
    return { position, neighbors: mode === 1 ? [next?.id, prev?.id] : [prev?.id, next?.id] };
  }
  function resetPlaylistNavigation(ctx) {
    ctx.queueLookup = null;
    ctx.queueRetry = 0;
    ctx.randomSource = null;
    ctx.orderReady = false;
    ctx.deferredLookup = false;
    ctx.positionText = '';
    for (const link of ctx.queueNav?.children || []) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      if (link.tagName === 'BUTTON') link.disabled = true;
    }
    schedule();
  }
  function requestPlaylistStep(ctx, index) {
    if (ctx.orderReady) {
      const control = ctx.queueNav?.children[index];
      if (control?.getAttribute('aria-disabled') === 'false') control.click();
      return;
    }
    ctx.pendingStep = { index };
    ctx.queueRetry = 0;
    if (ctx.deferredLookup) {
      ctx.queueLookup = null;
      ctx.deferredLookup = false;
    }
    schedule();
  }
  function routePlaylistLink(ctx, link, event) {
    if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const id = link.pathname.split('/')[2];
    if (ctx.knownPages.has(id)) {
      try { sessionStorage.setItem(ctx.orderKey + ':target', JSON.stringify([id, ctx.knownPages.get(id)])); } catch {}
    }
    const native = all('.playlist__item:not(.iwp-queue-item) a[href], a.playlist__item:not(.iwp-queue-item)[href]', ctx.player)
      .find(item => item.pathname === link.pathname && item.search === link.search);
    if (native) {
      event.preventDefault();
      native.click();
      return;
    }
    // React Router tracks same-document history entries with an integer index.
    if (Number.isInteger(history.state?.idx)) {
      const state = { usr: null, key: crypto.randomUUID().slice(0, 8), idx: history.state.idx + 1 };
      history.pushState(state, '', link.href);
      event.preventDefault();
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    }
  }
  async function playRandomVideo(ctx, button) {
    let source = ctx.randomSource;
    if (!source || source.count < 2 || ctx.randomPending || button.disabled) return;
    ctx.randomPending = true;
    try {
      while (current === ctx && button.isConnected && ctx.orderMode === 2) {
        const pages = ctx.pages;
        source ||= (await loadPlaylistOrder(ctx, pages, 2, true))?.randomSource;
        if (ctx.pages !== pages) { source = null; continue; }
        if (!source || source.count < 2) return;
        const draw = Math.floor(Math.random() * (source.count - 1));
        const index = draw < source.absolute ? draw : draw + 1;
        const page = await playlistPage(ctx, Math.floor(index / source.limit), pages);
        if (ctx.pages !== pages) { source = null; continue; }
        const id = page.results[index % source.limit]?.id;
        if (current !== ctx || !button.isConnected || ctx.orderMode !== 2 || !id || id === ctx.id) return;
        const url = new URL(location.href);
        url.pathname = '/video/' + encodeURIComponent(id);
        const link = element('a', '', { href: url.href });
        link.hidden = true;
        link.onclick = event => routePlaylistLink(ctx, link, event);
        ctx.player.append(link);
        link.click();
        link.remove();
        return;
      }
    } catch (error) {
      if (!ctx.abort.signal.aborted) console.debug('[Iwara Plus]', error);
    } finally {
      ctx.randomPending = false;
    }
  }
  function playlistRow(ctx, video) {
    const link = element('a', '', { class: 'playlist__item iwp-queue-item', href: '/video/' + encodeURIComponent(video.id) + '?playlist=' + encodeURIComponent(ctx.playlist) });
    link.onclick = event => routePlaylistLink(ctx, link, event);
    if (video.fileId) {
      const thumb = String(video.thumbnail || 0).padStart(2, '0');
      link.append(element('img', '', { loading: 'lazy', alt: '', class: 'thumbnail', src: 'https://i.iwara.tv/image/thumbnail/' + encodeURIComponent(video.fileId) + '/thumbnail-' + thumb + '.jpg' }));
    }
    const info = element('div', '', { class: 'playlist__item__info' });
    const title = element('div', '', { class: 'text text--text text--bold' });
    title.textContent = video.title;
    const author = element('div', '', { class: 'username' });
    author.title = video.author || '';
    const name = element('div', '', { class: 'text text--small' });
    name.textContent = author.title;
    author.append(name);
    info.append(title, author);
    link.append(info);
    return link;
  }
  function extendPlaylist(ctx, list) {
    const reverse = ctx.orderMode === 1;
    if (!list || (ctx.queueList === list && ctx.reverseList === reverse)) return;
    const switching = !!ctx.queueList;
    ctx.clearQueueList?.();
    ctx.queueList = list;
    ctx.reverseList = reverse;
    const listeners = new AbortController();
    let initialize = reverse || switching;
    let nextPage = 1, pending, done = false;
    let previousTop = list.scrollTop, touchY, retryTopAt = 0;
    let refreshing = false;
    const status = element('span', '', { role: 'status', class: 'text text--small' });
    const header = $('.playlist__header', list.parentElement) || $('.playlist__header__about', list.parentElement);
    header?.append(status);
    ctx.queueStatus?.remove();
    ctx.queueStatus = status;
    let statusTimer;
    ctx.clearQueueList = () => {
      listeners.abort();
      clearTimeout(statusTimer);
      all('.iwp-queue-item', list).forEach(node => node.remove());
      list.classList.remove('iwp-refreshed', 'iwp-queue-initializing');
      for (const row of all(':scope > .playlist__item', list)) {
        row.classList.remove('iwp-stale-row');
        row.style.removeProperty('order');
      }
    };
    const feedback = key => {
      clearTimeout(statusTimer);
      console.debug('[Iwara Plus]', translate(key));
      if (key === '列表已是最新' || key === '列表已更新') {
        status.textContent = '';
        delete status.dataset.iwpTextContent;
        return;
      }
      localize(status, 'textContent', key);
      if (!refreshing) statusTimer = setTimeout(() => {
        status.textContent = '';
        delete status.dataset.iwpTextContent;
      }, 2400);
    };
    let renderedIds, retryBottomAt = 0;
    const updatePage = async upward => {
      if (listeners.signal.aborted || current !== ctx || ctx.queueList !== list) return;
      if (initialize && Date.now() < retryBottomAt) return;
      if (!initialize && (ctx.queueToggle.getAttribute('aria-expanded') === 'false' || (upward ? list.scrollTop > 1 || Date.now() < retryTopAt
        : done || Date.now() < retryBottomAt || list.scrollHeight - list.clientHeight - list.scrollTop > 160))) return;
      if (pending && (!upward || refreshing)) return;
      // A top refresh supersedes a pending append, including its page requests.
      const request = {};
      pending = request;
      refreshing = upward;
      let message = '刷新失败，请再向上滚动重试';
      try {
        if (upward) {
          feedback('正在刷新列表…');
          ctx.pages = new Map();
          ctx.knownPages.clear();
          ctx.pageHint = undefined;
          ctx.currentPage = undefined;
          initialize = true;
          resetPlaylistNavigation(ctx);
        }
        const first = await playlistPage(ctx, 0);
        if (pending !== request || listeners.signal.aborted) return;
        if (upward || initialize) {
          let page = reverse ? Math.max(0, Math.ceil(first.count / first.limit) - 1) : 0;
          let head = first;
          while (page > 0) {
            head = await playlistPage(ctx, page);
            if (pending !== request || listeners.signal.aborted) return;
            if (head.results.length) break;
            if (--page === 0) head = first;
          }
          const fresh = reverse ? { ...head, results: [...head.results].reverse() } : head;
          if (listeners.signal.aborted || current !== ctx || ctx.queueList !== list) return;
          const native = all(':scope > .playlist__item:not(.iwp-queue-item)', list);
          const nativeRows = new Map();
          for (const row of native) {
            const link = row.matches('a[href]') ? row : $('a[href*="/video/"]', row);
            const id = link?.pathname?.match(/^\/video\/([^/]+)/)?.[1];
            if (id) nativeRows.set(id, row);
            row.classList.add('iwp-stale-row');
          }
          all('.iwp-queue-item', list).forEach(row => row.remove());
          list.classList.add('iwp-refreshed');
          fresh.results.forEach((video, index) => {
            const row = nativeRows.get(video.id);
            const freshRow = playlistRow(ctx, video);
            const info = row && $('.playlist__item__info', row);
            if (info && info.firstElementChild?.textContent === video.title &&
                $('.username .text', info)?.textContent === (video.author || '') &&
                $('.thumbnail', row)?.src === $('.thumbnail', freshRow)?.src) {
              row.classList.remove('iwp-stale-row');
              row.style.order = String(index - fresh.results.length);
            } else {
              freshRow.style.order = String(index - fresh.results.length);
              list.append(freshRow);
            }
          });
          nextPage = reverse ? page - 1 : 1;
          renderedIds = new Set(fresh.results.map(video => video.id));
          done = nextPage < 0 || nextPage * fresh.limit >= fresh.count;
          list.classList.remove('iwp-queue-initializing');
          initialize = false;
          schedule();
          message = '列表已更新';
          return;
        }
        if (nextPage * first.limit >= first.count) { done = true; return; }
        const data = await playlistPage(ctx, nextPage);
        if (pending !== request || listeners.signal.aborted || current !== ctx || ctx.queueList !== list) return;
        renderedIds ||= new Set(first.results.map(video => video.id));
        const fragment = document.createDocumentFragment();
        for (const video of reverse ? [...data.results].reverse() : data.results) {
          if (renderedIds.has(video.id)) continue;
          renderedIds.add(video.id);
          fragment.append(playlistRow(ctx, video));
        }
        list.append(fragment);
        nextPage += reverse ? -1 : 1;
        done = nextPage < 0 || nextPage * data.limit >= data.count;
      } catch {
        if (pending === request && (!upward || initialize)) {
          retryBottomAt = Date.now() + 1500;
          if (initialize && !upward) feedback(message);
        }
      }
      finally {
        if (pending === request) {
          pending = null;
          refreshing = false;
          if (upward && !listeners.signal.aborted && current === ctx && ctx.queueList === list) {
            retryTopAt = Date.now() + 1000;
            feedback(message);
          }
        }
      }
    };
    const options = { passive: true, signal: listeners.signal };
    list.addEventListener('scroll', () => {
      const upward = list.scrollTop < previousTop;
      previousTop = list.scrollTop;
      updatePage(upward);
    }, options);
    list.addEventListener('wheel', event => {
      if (event.deltaY) updatePage(event.deltaY < 0);
    }, options);
    list.addEventListener('touchstart', event => { touchY = event.touches[0]?.clientY; }, options);
    list.addEventListener('touchmove', event => {
      const y = event.touches[0]?.clientY;
      if (y != null && touchY != null && y !== touchY) updatePage(y > touchY);
      touchY = y;
    }, options);
    if (initialize) {
      list.classList.add('iwp-queue-initializing');
      list.scrollTop = 0;
      updatePage(false);
    }
  }
  function clearFullscreenList(ctx) {
    const panel = ctx.fullscreenPanel;
    if (!panel) return;
    const anchor = ctx.panelAnchor;
    if (anchor.parentNode) anchor.replaceWith(panel);
    else panel.remove();
    ctx.panelAnchor = null;
    panel.classList.remove('iwp-fullscreen-list');
    ctx.fullscreenPanel = null;
  }
  function playlistControls(ctx, bar) {
    const panel = $('.playlist', ctx.player);
    const surface = $('.videoPlayer', ctx.player);
    if (!panel || !surface) return;
    if (!ctx.orderButton) {
      ctx.pages = new Map();
      ctx.knownPages = new Map();
      ctx.orderKey = 'iwp-order:' + ctx.playlist;
      ctx.orderMode = 0;
      try {
        ctx.orderMode = [0, 1, 2][Number(sessionStorage.getItem(ctx.orderKey))] || 0;
        const target = JSON.parse(sessionStorage.getItem(ctx.orderKey + ':target'));
        if (Array.isArray(target) && target[0] === ctx.id && Number.isInteger(target[1])) ctx.pageHint = target[1];
        sessionStorage.removeItem(ctx.orderKey + ':shuffle');
      } catch {}
      const button = element('button', '', { type: 'button', class: 'iwp-order' });
      const refresh = () => {
        const label = ['顺序播放', '倒序播放', '随机播放'][ctx.orderMode];
        localize(button, 'title', label);
        localize(button, 'ariaLabel', label);
        const lines = 'M10 6h12M10 12h12M10 18h8';
        const path = ['M4 6v12m-2-2 2 2 2-2' + lines, 'M4 18V6m-2 2 2-2 2 2' + lines, 'M3 6h3c5 0 7 12 12 12h3m-3-3 3 3-3 3M3 18h3c2 0 4-3 5-5m3-5c1-1 2-2 4-2h3m-3-3 3 3-3 3'][ctx.orderMode];
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
      };
      button.onclick = () => {
        ctx.pendingStep = null;
        ctx.orderMode = (ctx.orderMode + 1) % 3;
        try { sessionStorage.setItem(ctx.orderKey, String(ctx.orderMode)); } catch {}
        resetPlaylistNavigation(ctx);
        refresh();
        schedule();
      };
      refresh();
      ctx.orderButton = button;
      ctx.player.addEventListener('play', event => {
        if (event.target === ctx.video) ctx.pendingStep = null;
      }, { capture: true, signal: ctx.abort.signal });
      window.addEventListener('ended', event => {
        if (!ctx.orderMode || event.target !== ctx.video || ctx.id !== videoId()) return;
        event.stopPropagation();
        requestPlaylistStep(ctx, 1);
      }, { capture: true, signal: ctx.abort.signal });
    }
    const header = $('.playlist__header', panel);
    if (header && ctx.orderButton.parentNode !== header) header.append(ctx.orderButton);
    const count = $('.playlist__header__about > .text:not(.iwp-queue-position)', panel);
    if (count) {
      ctx.queuePosition ||= element('span', '', { class: count.className + ' iwp-queue-position', 'aria-live': 'polite' });
      const label = count.textContent;
      const text = ctx.positionText && (/\d/.test(label) ? label.replace(/\d[\d,.\u00a0\u202f]*/, ctx.positionText) : ctx.positionText);
      if (ctx.queuePosition.textContent !== (text || '')) ctx.queuePosition.textContent = text || '';
      if (count.nextElementSibling !== ctx.queuePosition) count.after(ctx.queuePosition);
    }
    if (!ctx.queueToggle) {
      const toggle = element('button', '', { type: 'button', class: 'iwp-queue-toggle' });
      toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>';
      const storageKey = 'iwp-queue-collapsed:' + ctx.playlist;
      let collapsed = false;
      try { collapsed = sessionStorage.getItem(storageKey) === '1'; } catch {}
      const refresh = () => {
        toggle.setAttribute('aria-expanded', String(!collapsed));
        const label = collapsed ? '展开播放列表' : '收起播放列表';
        localize(toggle, 'ariaLabel', label);
        localize(toggle, 'title', label);
      };
      toggle.onclick = () => {
        collapsed = !collapsed;
        try { sessionStorage.setItem(storageKey, collapsed ? '1' : '0'); } catch {}
        refresh();
        schedule();
      };
      let hideTimer;
      const reveal = () => {
        clearTimeout(hideTimer);
        hideTimer = null;
        toggle.classList.add('iwp-near-edge');
      };
      const leaveEdge = () => {
        if (hideTimer || !toggle.classList.contains('iwp-near-edge')) return;
        hideTimer = setTimeout(() => {
          toggle.classList.remove('iwp-near-edge');
          hideTimer = null;
        }, 900);
      };
      ctx.updateQueuePlayback = () => {
        const playing = !!ctx.video && !ctx.video.paused && !ctx.video.ended;
        const wasPlaying = toggle.classList.contains('iwp-playing');
        toggle.classList.toggle('iwp-playing', playing);
        const rect = toggle.getBoundingClientRect();
        const point = ctx.controlPointer;
        if (point && point.x >= rect.left - 24 && point.x <= rect.right + 24 &&
            point.y >= rect.top - 24 && point.y <= rect.bottom + 24) reveal();
        else if (!wasPlaying && playing) toggle.classList.remove('iwp-near-edge');
        else leaveEdge();
      };
      ctx.abort.signal.addEventListener('abort', () => clearTimeout(hideTimer), { once: true });
      refresh();
      ctx.queueToggle = toggle;
    }
    const fullscreen = document.fullscreenElement;
    const host = fullscreen && surface.contains(fullscreen) ? fullscreen : ctx.player;
    const expanded = ctx.queueToggle.getAttribute('aria-expanded') === 'true';
    const overlay = fullscreen && ctx.player.contains(fullscreen) && !fullscreen.contains(ctx.panelAnchor || panel) && expanded;
    if (ctx.fullscreenPanel && (!overlay || ctx.fullscreenPanel !== panel)) clearFullscreenList(ctx);
    if (overlay && !ctx.fullscreenPanel) {
      ctx.panelAnchor = document.createComment('playlist fullscreen position');
      panel.before(ctx.panelAnchor);
      // Keep settings menus and the list in the same stacking context.
      const controlsHost = bar?.closest('.video-js');
      (controlsHost && fullscreen.contains(controlsHost) ? controlsHost : fullscreen).append(panel);
      panel.classList.add('iwp-fullscreen-list');
      ctx.fullscreenPanel = panel;
    }
    if (ctx.queueToggle.parentElement !== host) host.append(ctx.queueToggle);
    const align = () => {
      const bounds = host.getBoundingClientRect();
      const video = surface.getBoundingClientRect();
      const sidebar = panel.getBoundingClientRect();
      const beside = expanded && sidebar.width && (ctx.fullscreenPanel || (sidebar.left > video.left && sidebar.top < video.bottom));
      ctx.queueToggle.classList.toggle('iwp-beside', Boolean(beside));
      if (surface.parentElement === host && panel.parentElement === host && host === ctx.player && window.CSS?.supports('right', 'anchor(--iwp-sidebar left)')) return;
      const right = beside ? sidebar.left : host === ctx.player ? video.right : bounds.right;
      const center = host === ctx.player ? video.top + video.height / 2 : bounds.top + bounds.height / 2;
      const style = getComputedStyle(host);
      const zoom = host.currentCSSZoom || 1;
      ctx.queueToggle.style.setProperty('--iwp-edge', ((bounds.right - right) / zoom - parseFloat(style.borderRightWidth)) + 'px');
      ctx.queueToggle.style.setProperty('--iwp-edge-y', ((center - bounds.top) / zoom - parseFloat(style.borderTopWidth)) + 'px');
    };
    align();
    if (ctx.edgeSurface !== surface || ctx.edgePanel !== panel) {
      ctx.edgeObserver?.disconnect();
      ctx.edgeSurface = surface;
      ctx.edgePanel = panel;
      if (window.ResizeObserver) {
        ctx.edgeObserver = new ResizeObserver(schedule);
        for (const node of [ctx.player, surface, panel]) ctx.edgeObserver.observe(node);
      }
    }
    extendPlaylist(ctx, $('.playlist__items', panel));
    if (!bar) return;
    const random = ctx.orderMode === 2;
    if (!ctx.queueNav || ctx.randomControls !== random) {
      ctx.randomControls = random;
      ctx.queueNav?.remove();
      ctx.queueNav = element('div', '', { class: 'iwp-queue-nav' });
      for (const [label, path] of [['上一个视频', 'M4 5h3v14H4zm4 7 12-7v14z'], ['下一个视频', 'M17 5h3v14h-3zM4 5l12 7-12 7z']]) {
        const link = element(random ? 'button' : 'a', '', { class: 'vjs-control vjs-button', title: label, 'aria-label': label, 'aria-disabled': 'true' });
        link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
        if (random) {
          link.type = 'button';
          link.disabled = true;
        }
        const index = ctx.queueNav.children.length;
        link.onclick = event => {
          if (!ctx.orderReady) {
            event.preventDefault();
            requestPlaylistStep(ctx, index);
          } else if (random) playRandomVideo(ctx, link);
          else if (link.hasAttribute('href')) routePlaylistLink(ctx, link, event);
        };
        if (!random) link.onkeydown = event => {
          if (!link.hasAttribute('href') && link.tabIndex === 0 && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            link.click();
          }
        };
        ctx.queueNav.append(link);
      }
    }
    if (ctx.queueNav.parentElement !== bar) {
      const play = $('.vjs-play-control', bar);
      if (play?.parentElement === bar) play.after(ctx.queueNav);
      else bar.prepend(ctx.queueNav);
    }
    const pages = ctx.pages;
    if (ctx.queueLookup !== pages && Date.now() >= (ctx.queueRetry || 0)) {
      ctx.queueLookup = pages;
      const mode = ctx.orderMode;
      loadPlaylistOrder(ctx, pages, mode).then(result => {
        if (current !== ctx || ctx.pages !== pages || mode !== ctx.orderMode) return;
        if (result?.deferred) {
          ctx.deferredLookup = true;
          for (const control of ctx.queueNav.children) {
            control.setAttribute('aria-disabled', 'false');
            if (random) control.disabled = false;
            else { control.setAttribute('role', 'button'); control.tabIndex = 0; }
          }
          if (ctx.pendingStep || ctx.currentPage != null) { ctx.queueLookup = null; schedule(); }
          return;
        }
        ctx.orderReady = true;
        ctx.deferredLookup = false;
        ctx.positionText = result?.position || '';
        ctx.randomSource = result?.randomSource;
        const neighbors = result?.neighbors || [];
        schedule();
        Array.from(ctx.queueNav.children).forEach((link, i) => {
          link.removeAttribute('role');
          link.removeAttribute('tabindex');
          if (random) {
            link.disabled = !(ctx.randomSource?.count > 1);
            link.setAttribute('aria-disabled', String(link.disabled));
            return;
          }
          if (!neighbors[i]) {
            link.removeAttribute('href');
            link.setAttribute('aria-disabled', 'true');
            return;
          }
          const url = new URL(location.href);
          url.pathname = '/video/' + encodeURIComponent(neighbors[i]);
          link.href = url.href;
          link.setAttribute('aria-disabled', 'false');
        });
        const step = ctx.pendingStep;
        ctx.pendingStep = null;
        if (step && ctx.id === videoId()) requestPlaylistStep(ctx, step.index);
      }).catch(() => {
        if (current !== ctx || ctx.pages !== pages || mode !== ctx.orderMode) return;
        ctx.queueLookup = null;
        ctx.queueRetry = Date.now() + 30000;
      });
    }
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
    if (ctx.playlist) playlistControls(ctx, bar);
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
    ctx.updateControls();
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
    old.queueNav?.remove();
    old.clearQueueList?.();
    old.edgeObserver?.disconnect();
    clearFullscreenList(old);
    old.queueToggle?.remove();
    old.orderButton?.remove();
    old.queueStatus?.remove();
    old.queuePosition?.remove();
  }
  function bindFullscreenControls(ctx) {
    let awakeBar, awakeHost, ownsPopover = false;
    const reset = () => {
      if (ownsPopover) {
        awakeBar.removeAttribute('popover');
        ownsPopover = false;
      }
      awakeBar?.classList.remove('iwp-controls-awake');
      awakeBar = null;
      awakeHost = null;
    };
    ctx.updateControls = () => {
      ctx.updateQueuePlayback?.();
      const host = document.fullscreenElement;
      const video = ctx.video;
      const root = video?.closest('.video-js');
      const bar = root && $('.vjs-control-bar', root);
      if (!host || !ctx.player.contains(host) || !bar || !host.contains(bar) || root.classList.contains('vjs-controls-disabled')) {
        if (awakeBar) reset();
        return;
      }
      if (!video.paused && !video.ended) {
        const surface = host === ctx.player ? $('.videoPlayer', host) : host;
        const frame = (surface || host).getBoundingClientRect();
        const sidebar = ctx.queueToggle?.getAttribute('aria-expanded') === 'true'
          ? ctx.edgePanel?.getBoundingClientRect() : null;
        const right = sidebar?.width && sidebar.left > frame.left && sidebar.top < frame.bottom
          ? Math.min(frame.right, sidebar.left) : frame.right;
        const point = ctx.controlPointer;
        let inside = false;
        if (point && point.x >= frame.left && point.x < right && point.y <= frame.bottom) {
          inside = point.y >= frame.bottom - Math.max(56, bar.offsetHeight);
          if (!inside && awakeBar === bar) {
            const hit = document.elementFromPoint(point.x, point.y);
            inside = !!hit && (bar.contains(hit) || all('[aria-controls]', bar).some(control =>
              control.getAttribute('aria-controls').split(/\s+/).some(id => document.getElementById(id)?.contains(hit))));
          }
        }
        if (!inside && !bar.querySelector(':focus-visible')) {
          if (awakeBar) reset();
          return;
        }
      }
      if (awakeBar !== bar || awakeHost !== host) reset();
      const waking = awakeBar !== bar;
      awakeBar = bar;
      awakeHost = host;
      bar.classList.add('iwp-controls-awake');
      if (bar.showPopover && !bar.hasAttribute('popover')) {
        bar.setAttribute('popover', 'manual');
        ownsPopover = true;
      }
      if (ownsPopover && !bar.matches(':popover-open')) bar.showPopover();
      if (waking) root.player?.userActive?.(true);
    };
    const options = { capture: true, passive: true, signal: ctx.abort.signal };
    const track = event => {
      ctx.controlPointer = { x: event.clientX, y: event.clientY };
      ctx.updateControls();
    };
    const forget = () => {
      ctx.controlPointer = null;
      ctx.updateControls();
    };
    for (const type of ['pointermove', 'pointerover', 'pointerdown']) window.addEventListener(type, track, options);
    window.addEventListener('pointerout', event => {
      // Moving a bar into the top layer can retarget the pointer at the same coordinates.
      if (!event.relatedTarget && (event.clientX < 0 || event.clientY < 0 ||
          event.clientX >= innerWidth || event.clientY >= innerHeight)) forget();
    }, options);
    window.addEventListener('blur', forget, { signal: ctx.abort.signal });
    for (const type of ['playing', 'play', 'pause', 'ended', 'emptied'])
      ctx.player.addEventListener(type, ctx.updateControls, options);
    document.addEventListener('fullscreenchange', ctx.updateControls, options);
    ctx.player.addEventListener('toggle', event => {
      if (event.target === awakeBar && event.newState === 'closed') ctx.updateControls();
    }, options);
    ctx.abort.signal.addEventListener('abort', reset, { once: true });
  }
  function mount(id, player, details, playlist) {
    const ctx = { id, player, details, playlist, nativeActions: new Map(), nativeStats: new Map(), abort: new AbortController() };
    current = ctx;
    bindFullscreenControls(ctx);
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
    const playlist = new URLSearchParams(location.search).get('playlist');
    if (current && (current.id !== id || current.playlist !== playlist || current.details !== details || !current.player.isConnected || !current.toolbar.isConnected || (player && player !== current.player))) dispose();
    const video = player && $('video', player);
    if (id && video && (startupVideo !== video || (video.autoplay && blockStartup))) {
      startupVideo = video;
      holdPlayback(video);
    }
    if (id && player && details) {
      if (!current) mount(id, player, details, playlist);
      else enhance(current);
    }
  }
  function schedule() {
    if (!suspended && !queued) { queued = true; queueMicrotask(sync); }
  }
  const observer = new MutationObserver(schedule);
  const observeOptions = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'autoplay', 'lang'] };
  observer.observe(document, observeOptions);
  document.addEventListener('fullscreenchange', schedule);
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
