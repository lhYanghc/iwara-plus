# Iwara Plus 运行时 UML

[English](architecture.md) · 简体中文 · [插件源码](../iwara-plus.user.js)

## 运行结构

方框按职责归纳同一脚本里的函数。脚本通过 `current` 最多持有一个活动视频上下文，工具栏、播放器和播放列表函数共用这个上下文。

```mermaid
---
title: Iwara Plus v1.0.14 运行结构
---
classDiagram
    direction TB
    class Lifecycle["页面生命周期"] {
        schedule()
        sync()
        mount()
        enhance()
        dispose()
    }
    class Context["当前视频上下文 ctx"] {
        id
        player
        details
        playlist
        abort
        meta
    }
    class Playback["播放输入"] {
        syncPlaybackRoute()
        handlePlayerInput()
        holdPlayback()
    }
    class Player["播放器增强"] {
        theatre()
        restore()
        attachVideo()
    }
    class Toolbar["工具栏操作"] {
        filename()
        refreshNames()
        positiveButton()
        downloadLink()
    }
    class Queue["播放列表"] {
        playlistControls()
        extendPlaylist()
        playlistPage()
        loadPlaylistOrder()
        playRandomVideo()
    }
    class API["Iwara API"]
    Lifecycle "1" *-- "0..1" Context : 持有
    Lifecycle ..> Playback : 检查起播
    Lifecycle ..> Player : 绑定视频
    Lifecycle ..> Toolbar : 安装操作按钮
    Lifecycle ..> Queue : 启用列表控件
    Lifecycle ..> API : GET /video/id
    Queue ..> API : GET /playlist/id
```

## 视频页生命周期

切换视频、播放列表或替换详情节点、播放器容器均可触发重新挂载。仅替换视频元素时，脚本重新绑定视频监听器。`pagehide` 时脚本回收上下文并停止观察与轮询，`pageshow` 时恢复观察、轮询和同步。

```mermaid
---
title: Iwara Plus v1.0.14 视频页生命周期
---
sequenceDiagram
    participant B as 浏览器与 Iwara 页面
    participant L as 增强脚本
    participant A as Iwara API
    B->>L: 首次执行调用 sync()
    Note over B,L: 后续 DOM、路由、全屏事件及 750 ms 定时器触发 schedule()
    L->>L: 读取路由，定位播放器和详情节点
    opt 旧上下文失效
        L->>L: dispose() 中止请求，清理监听器与帧回调
        L->>B: 还原原生节点并移除增强控件
    end
    alt 页面节点就绪且没有活动上下文
        L->>L: mount() 创建 ctx
        L->>B: 插入工具栏，应用影院设置并增强控件
        L->>A: GET /video/{id}
        alt 成功且 ctx 仍然有效
            A-->>L: 视频元数据
            L->>B: 刷新文件名选项
        else 请求失败且未被主动取消
            L->>B: 提示上传日期暂不可用
        end
    else 当前上下文仍然有效
        L->>B: enhance() 绑定新增或替换的元素
    else 页面节点尚未就绪
        Note over L: 等待下次同步
    end
```

## 起播保护

单击画面会将焦点交给播放器，500 毫秒后若仍是当前视频则切换播放。双击会取消待执行的单击操作并切换全屏。播放器获得焦点后，I 切换画中画，T 切换影院模式。自动播放开关保存下次打开视频时使用的偏好。

```mermaid
---
title: Iwara Plus v1.0.14 起播保护
---
stateDiagram-v2
    state "等待用户起播" as Guarded
    state "允许起播" as Allowed
    state Choice <<choice>>
    [*] --> Choice
    Choice --> Guarded : 自动播放偏好关闭
    Choice --> Allowed : 自动播放偏好开启
    Guarded --> Guarded : 收到 play 或 playing 事件时暂停视频
    Guarded --> Allowed : 播放按钮、确认单击或检测到键盘起播
    Guarded --> Choice : 视频 ID 改变
    Allowed --> Choice : 视频 ID 改变
```

## 工具栏一键操作

工具栏也支持单独复制文件名、下载原画和打开封面。文件名格式、影院模式、自动选择 Source 和自动播放偏好通过 GM 存储保存。脚本在站点语言改变时更新控件文案，保留原生统计节点，并通过视频帧回调估算帧率。

```mermaid
---
title: Iwara Plus v1.0.14 工具栏一键操作
---
sequenceDiagram
    actor U as 用户
    participant T as 工具栏
    participant G as Tampermonkey
    participant D as Iwara 页面
    U->>T: 复制、喜欢、关注并下载
    T->>D: 查找 Source 下载链接
    alt 链接缺失
        T-->>U: 提示先展开下载菜单
    else 链接已就绪
        T->>G: GM_setClipboard(filename)
        opt 识别出尚未喜欢
            T->>D: 点击喜欢
        end
        opt 识别出尚未关注
            T->>D: 点击关注
        end
        T->>D: 点击 Source 下载链接
        T-->>U: 显示操作已请求
    end
```

## 播放列表导航

列表分页缓存在当前视频上下文中。倒序和随机模式在视频结束时触发可用的下一项控件。侧栏按需加载分页以扩展列表。进入全屏时，已展开的面板可移入全屏元素，退出时按锚点归位。播放顺序与侧栏折叠状态保存在会话存储中。

```mermaid
---
title: Iwara Plus v1.0.14 播放列表导航
---
sequenceDiagram
    participant C as 播放列表控件
    participant Q as 播放列表数据
    participant A as Iwara API
    participant B as 浏览器
    C->>Q: loadPlaylistOrder(ctx)
    Q->>A: 按需获取分页以定位当前视频
    A-->>Q: 视频条目、总数与分页大小
    alt 顺序或倒序
        Q-->>C: 按所选顺序返回相邻条目与位置
        C->>B: 激活可用的上下集链接
    else 随机
        Q-->>C: 当前位置、总数与分页大小
        C->>Q: 抽取当前项以外的随机位置
        Q->>Q: 通过 playlistPage() 读取目标条目
        Q->>B: 确认上下文和模式仍有效后跳转
    end
```
