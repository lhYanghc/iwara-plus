# Iwara Plus runtime UML

English · [简体中文](architecture.zh-CN.md) · [Userscript source](../iwara-plus.user.js)

## Runtime structure

The boxes group functions in the userscript by responsibility. The script holds at most one active video context in `current`. The toolbar, player and playlist functions share that context.

```mermaid
---
title: Iwara Plus v1.0.15 Runtime structure
---
classDiagram
    direction TB
    class Lifecycle["Page lifecycle"] {
        schedule()
        sync()
        mount()
        enhance()
        dispose()
    }
    class Context["Current video context ctx"] {
        id
        player
        details
        playlist
        abort
        meta
    }
    class Playback["Playback input"] {
        syncPlaybackRoute()
        handlePlayerInput()
        holdPlayback()
    }
    class Player["Player enhancements"] {
        theatre()
        restore()
        attachVideo()
        bindFullscreenControls()
    }
    class Toolbar["Toolbar actions"] {
        filename()
        refreshNames()
        positiveButton()
        downloadLink()
    }
    class Queue["Playlist"] {
        playlistControls()
        extendPlaylist()
        playlistPage()
        loadPlaylistOrder()
        playRandomVideo()
        requestPlaylistStep()
        routePlaylistLink()
    }
    class API["Iwara API"]
    Lifecycle "1" *-- "0..1" Context : owns
    Lifecycle ..> Playback : checks startup
    Lifecycle ..> Player : binds media
    Lifecycle ..> Toolbar : mounts actions
    Lifecycle ..> Queue : enables list controls
    Lifecycle ..> API : GET /video/id
    Queue ..> API : GET /playlist/id
```

## Video page lifecycle

A change of video, playlist, details node or player container can trigger a remount. Replacing only the video element rebinds its listeners. On `pagehide` the script disposes of the context and stops observing and polling. On `pageshow` it resumes observation, polling and synchronization.

```mermaid
---
title: Iwara Plus v1.0.15 Video page lifecycle
---
sequenceDiagram
    participant B as Browser and Iwara page
    participant L as Userscript
    participant A as Iwara API
    B->>L: Initial execution calls sync()
    Note over B,L: Later DOM, route and fullscreen events and a 750 ms timer call schedule()
    L->>L: Read route and locate player and details
    opt Old context invalid
        L->>L: dispose() aborts requests and cleans up listeners and frame callbacks
        L->>B: Restore native nodes and remove injected controls
    end
    alt Page ready and no current context
        L->>L: mount() creates ctx
        L->>B: Insert toolbar, apply theatre layout and enhance controls
        L->>A: GET /video/{id}
        alt Success and ctx still current
            A-->>L: Video metadata
            L->>B: Refresh filename options
        else Request failed without cancellation
            L->>B: Show date unavailable
        end
    else Current context still valid
        L->>B: enhance() binds new or replaced elements
    else Page not ready
        Note over L: Wait for the next sync
    end
```

## Playback startup guard

A surface click focuses the player. After 500 ms it toggles playback if the video is still current. A double click cancels the pending toggle and switches fullscreen. With the player focused, I activates picture-in-picture and T toggles theatre mode. The autoplay switch saves the preference used on the next video.

```mermaid
---
title: Iwara Plus v1.0.15 Playback startup guard
---
stateDiagram-v2
    state "Waiting for user playback" as Guarded
    state "Playback allowed" as Allowed
    state Choice <<choice>>
    [*] --> Choice
    Choice --> Guarded : autoplay preference off
    Choice --> Allowed : autoplay preference on
    Guarded --> Guarded : play or playing event / pause media
    Guarded --> Allowed : play control, confirmed single click or observed keyboard playback
    Guarded --> Choice : video ID changed
    Allowed --> Choice : video ID changed
```

## Combined toolbar action

The toolbar also supports copying a filename, downloading the source and opening the cover individually. Filename format, theatre mode, automatic Source selection and autoplay persist via GM storage. The script localizes controls when the site language changes, preserves native statistics, and estimates frame rate from video frame callbacks.

```mermaid
---
title: Iwara Plus v1.0.15 Combined toolbar action
---
sequenceDiagram
    actor U as Viewer
    participant T as Toolbar
    participant G as Tampermonkey
    participant D as Iwara page
    U->>T: Copy, like, follow and download
    T->>D: Find Source download link
    alt Link missing
        T-->>U: Ask user to open the download menu
    else Link available
        T->>G: GM_setClipboard(filename)
        opt Like button recognized as inactive
            T->>D: Click Like
        end
        opt Follow button recognized as inactive
            T->>D: Click Follow
        end
        T->>D: Click Source download link
        T-->>U: Report requested actions
    end
```

## Playlist navigation

Playlist pages are cached per video context. Reverse and random modes wait for pending playlist data before advancing at the end of playback. The sidebar extends the visible list by loading pages as needed. In fullscreen the expanded panel can move into the fullscreen element and return to its anchor on exit. Order mode and sidebar collapse state use session storage.

```mermaid
---
title: Iwara Plus v1.0.15 Playlist navigation
---
sequenceDiagram
    participant C as Playlist controls
    participant Q as Playlist data
    participant A as Iwara API
    participant B as Browser
    opt Refresh at the top
        C->>Q: Replace page cache and clear saved positions
        Q->>A: Read first page, then resolve last page for reverse order
        Q-->>C: Rebuild rows by video ID and load further pages on scroll
    end
    Q->>A: Locate current video by ID, deferring large-list scans until needed
    A-->>Q: Items, count and page size
    opt Reverse or random playback ends before pages are ready
        C->>Q: Keep the next request and resume when data arrives
    end
    alt Forward or reverse
        Q-->>C: Neighbors in selected order and position
    else Random
        Q-->>C: Current index, count and page size
        C->>Q: Draw an index excluding the current item
        Q->>Q: Resolve item via playlistPage()
        opt Refresh invalidates the draw
            Q->>Q: Locate the current item again and redraw from fresh pages
        end
    end
    C->>B: Prefer same-document navigation and fall back to a normal link
```

## Fullscreen control visibility

With the sidebar open, the bottom activation area spans only the video width.

```mermaid
---
title: Iwara Plus v1.0.15 Fullscreen control visibility
---
sequenceDiagram
    participant B as Browser
    participant P as Player
    participant S as Playlist toggle
    alt Paused or ended
        B->>P: Show bottom controls and playlist toggle
    else Playing
        opt Near video bottom or over its open menu
            B->>P: Reveal or keep bottom controls visible
        end
        opt Pointer away and no keyboard focus in controls
            B->>P: Restore native control visibility
        end
        opt Near playlist toggle
            B->>S: Stay visible while hovered and fade after about 0.9 s away
        end
    end
```

On some devices Chrome may show only tooltips during fullscreen playback with graphics acceleration enabled. Current observations suggest a display and graphics driver compatibility issue. Updating the driver or turning off graphics acceleration and restarting Chrome may help.
