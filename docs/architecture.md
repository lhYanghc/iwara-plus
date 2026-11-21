# Iwara Plus runtime UML

English · [简体中文](architecture.zh-CN.md) · [Userscript source](../iwara-plus.user.js)

## Runtime structure

The boxes group functions in the userscript by responsibility. The script holds at most one active video context in `current`. The toolbar, player and playlist functions share that context.

```mermaid
---
title: Iwara Plus v1.0.14 Runtime structure
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
title: Iwara Plus v1.0.14 Video page lifecycle
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
title: Iwara Plus v1.0.14 Playback startup guard
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
title: Iwara Plus v1.0.14 Combined toolbar action
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

Playlist pages are cached per video context. Reverse and random modes use the enabled next control when playback ends. The sidebar extends the visible list by loading pages as needed. In fullscreen the expanded panel can move into the fullscreen element and return to its anchor on exit. Order mode and sidebar collapse state use session storage.

```mermaid
---
title: Iwara Plus v1.0.14 Playlist navigation
---
sequenceDiagram
    participant C as Playlist controls
    participant Q as Playlist data
    participant A as Iwara API
    participant B as Browser
    C->>Q: loadPlaylistOrder(ctx)
    Q->>A: Fetch missing pages to locate current item
    A-->>Q: Items, count and page size
    alt Forward or reverse
        Q-->>C: Neighbors in selected order and position
        C->>B: Follow an enabled navigation link
    else Random
        Q-->>C: Current index, count and page size
        C->>Q: Draw an index excluding the current item
        Q->>Q: Resolve item via playlistPage()
        Q->>B: Navigate if context and mode still match
    end
```
