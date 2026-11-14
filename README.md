# Iwara Plus

English · [简体中文](README.zh-CN.md)

[Install from Sleazy Fork](https://sleazyfork.org/en/scripts/605034) · [Install from GitHub](https://raw.githubusercontent.com/lhYanghc/iwara-plus/main/iwara-plus.user.js) · [Releases](https://github.com/lhYanghc/iwara-plus/releases) · [Report an issue](https://github.com/lhYanghc/iwara-plus/issues)

A single userscript combining the main features of [Neko0's Iwara enhancements](https://github.com/nekozero/neko0-web-tools/blob/master/automation/iwara.js) and [Theatre for iwara](https://sleazyfork.org/en/scripts/543437-theatre-for-iwara), with native-looking controls, a responsive theatre layout, and a collapsible enhancement panel.

The runtime has no jQuery, Webpack Hacks, or remotely loaded code dependencies. This is an independent project, not an official release from Iwara or the original script authors.

## Installation

1. Install a userscript manager such as Tampermonkey in Chrome.
2. Disable the original **Neko0 Iwara enhancements** and **Theatre for iwara** scripts to avoid duplicate actions and layout conflicts. Keep them if you want an easy rollback.
3. Use one of the installation links above and confirm installation in your userscript manager.
4. Reload an Iwara video page. The theatre switch appears on the player control bar, before the fullscreen button. The centered chevron below the native action row expands the extra tools.

You can also import `iwara-plus.user.js` as a local file, or paste its full contents into a new userscript. GitHub installations use the repository's metadata file for update checks; Sleazy Fork provides its own installation and update endpoint.

## Features

- **Responsive theatre mode:** enabled by default, remembers your preference, follows the available content width, and adapts when the left navigation opens or the window narrows. The original details and right sidebar remain below the player.
- **Native site styling:** original action buttons, light/dark theme support, and an Iwara icon in the userscript manager. A recognized active Like button turns red and returns to its normal style when unliked.
- **A compact, collapsible panel:** starts closed on each video. Tools unfold downwards with a scroll-like reveal; the divider and centered chevron move with the lower edge. The chevron flips vertically after most of the reveal finishes. Reduced-motion preferences are respected.
- **Five filename choices:** each option shows the actual name that will be copied, based on the current title, author, and upload date, with Windows-invalid characters removed. There is no duplicate filename outside the selector.
- **Copy and download tools:** copy a name, request the site's Source download, open the cover image, or explicitly run copy + Like + Follow + download together.
- Videos open paused by default. The autoplay toggle between the time display and the picture-in-picture button remembers whether to allow the site's autoplay on the next video. Click the picture or loading spinner to play or pause, or double-click the picture to enter or exit fullscreen.
- With the video surface focused, press **I** to toggle browser picture-in-picture or **T** to toggle theatre mode. Click the picture or loading spinner to give the player keyboard focus.
- **Source selection:** automatically selects a newly discovered Source option; you can turn it off. It does not continuously override manual resolution changes.
- **Always-visible video data:** resolution and estimated playback frame rate sit beside the original like/view counts, using the same typography. The data group wraps together on narrow screens, and low-quality readings keep their color warning.
- **SPA lifecycle handling:** cleans up old requests, controls, video events, and frame callbacks when navigating between videos. An unavailable upload-date API does not block the rest of the interface.

## Behavior and limitations

- The combined action sends Like, Follow, and download requests only when clicked. Recognized active buttons are skipped; unknown states are not guessed. Check the website for the actual outcome.
- Downloads use the site's own Source link and the browser's save behavior. Copied filenames are **not automatically applied** to downloaded files. If the link is missing, expand the site's download menu first.
- The cover tool opens the image in a new tab for manual saving.
- Frame rate is estimated from playback, not read from encoding metadata. Paused, background, or speed-adjusted playback may not provide reliable readings. The browser must support `requestVideoFrameCallback`.
- A new userscript cannot read another script's private GM settings. Choose your preferred filename format again. The original Theatre preference key is recognized on first use when present.
- The site's age prompt remains for the user to handle.
- Website DOM, icon, and menu changes may require selector updates. Do not run the two original scripts alongside this one.

## Development and verification

Requires Node.js 20.19+ (24 recommended), pnpm 11.25.0, and Chrome.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm test
pnpm build:meta
```

The automated tests cover playback gestures, saved autoplay preferences, autoplay prevention, player and details controls, lifecycle cleanup, theatre restoration, actual copied names, active Like/Follow protection, missing downloads, failed metadata, portrait video dimensions, and video replacement. Headless Chrome tests use a local fixture at widths of 390, 600, 1000, and 1440 pixels to check menu changes, animations, wrapping, and theme changes. All fixture requests are intercepted; tests do not use your personal Chrome profile or real Iwara content.

These checks do not guarantee compatibility with every live website version, account, or playback scenario. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md) for contribution and version details.

## License and credits

**AGPL-3.0-or-later.** You may use, study, modify, and redistribute the code subject to the license's attribution and source-availability requirements. See [LICENSE](LICENSE) and [THIRD_PARTY.md](THIRD_PARTY.md).

Credit to **JoJunIori** for Neko0's Iwara enhancements. The theatre behavior was independently implemented; this repository does not distribute the original unlicensed Theatre source or its Webpack Hacks dependency. Iwara's logo and trademarks belong to their respective owners and are not covered by this project's code license.
