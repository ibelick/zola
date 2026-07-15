# AI 广告位接入设计

## 目标

在不影响现有 AI 流式回答的前提下，接入 Native Text 和 Small Card 两个广告位：

- Native Text 在 AI 回答流中将广告平台指定的关键词渲染为超链接。
- Small Card 在当次 AI 回答结束后渲染在回答末尾。
- 广告请求、渲染或监测失败时必须静默降级，不得阻塞聊天主链路。

## 已确认的广告位与服务地址

| 样式 | 广告位 ID | 广告位名称 | 接入 Key |
| --- | --- | --- | --- |
| Native Text | `8` | `Native_Text-Test` | `cmrloph8700031xywuz5ijj94` |
| Small Card | `7` | `SmallCard-Test` | `cmrlha7j000011xywcsjy39x1` |

真实广告服务基地址为 `http://10.1.51.76:8080`。

- Small Card：`POST http://10.1.51.76:8080/api/v1/ad/query`
- Native Text：`ws://10.1.51.76:8080/api/v1/ad/stream-match`

实际接口探测结果与文档示例存在两处差异：

- Small Card 服务实际识别 `X-Placement-Key`；仅发送文档中的 `X-Publisher-Key` 会返回 `missing placement key`。代理请求将同时发送 `X-Placement-Key`、`X-Publisher-Key` 和 `X-Ad-Slot-ID`，兼容真实服务与协议约定。
- Native Text 已验证可通过 `placement_key`、`slot_id` 和 `request_id` 查询参数完成 WebSocket `101 Switching Protocols` 握手。

## 架构

采用“Small Card 服务端代理 + Native Text 浏览器直连”的混合架构。

### Small Card 服务端代理

真实 Small Card 接口对浏览器的 CORS 预检返回 `404`，因此前端不直接请求该接口。项目新增同源 Next.js API 路由：

1. 前端在 AI 回答完成后请求本地 Small Card API，传入当次用户问题和浏览器语言；MVP 不在媒体端额外提取关键词，`context.keywords` 发送空数组。
2. 本地 API 生成唯一 `request_id`，组装协议 JSON 并请求真实广告服务。
3. 本地 API 校验返回值，只向前端暴露渲染和监测所需字段。
4. 返回无广告、超时、非法 JSON 或非成功状态时，本地 API 返回可静默处理的空结果。

### Native Text 浏览器直连

前端为每次新的 AI 回答建立一个 WebSocket 会话：

1. AI 请求进入 `submitted` 时创建连接，使其在首个回答 Chunk 出现前完成握手。
2. 根据上一次已观察到的助手文本计算新增文字，将增量文字按递增 `chunk_id` 发送为 `text_chunk` 帧。
3. 收到 `inject_anchor` 后校验必填字段，并将指令关联到当前助手消息。
4. 回答完成、用户停止生成、发生错误、切换会话或组件卸载时关闭连接。
5. 连接失败或中断后不重试当次回答，避免重复喂入 Chunk 或影响 AI 输出。

## 前端状态与数据流

广告状态位于聊天前端会话内，以助手消息 ID 为键：

- Native Text 状态保存已校验的锚点指令数组。
- Small Card 状态保存单个结构化广告素材。MVP 只渲染返回广告数组中的第一条。
- 当前回答对应的用户问题来自该助手消息前最近的用户消息。
- 广告数据不写入 Supabase、IndexedDB 或聊天消息正文。重新打开历史会话时不为历史回答重新拉取广告。
- 切换 `chatId` 时清空当前广告状态和已上报去重状态。

Small Card 请求只在新的助手回答正常完成后触发一次。停止生成或 AI 报错时不拉取小卡片。重新生成回答被视为一次新回答，可以产生新广告请求。

## Native Text 渲染

Native Text 渲染保持现有 Markdown 语义，不直接修改并持久化助手消息文本。渲染层在当前消息 DOM 容器内定位关键词，并替换首个合法匹配：

- 跳过 `a`、`code`、`pre`、`script` 和 `style` 节点内容。
- 同一 `anchor_dom_id` 只生成一个锚点。
- 多条指令按服务端到达顺序应用。
- 如果关键词跨越多个 Markdown/DOM 文本节点，或当前消息中不存在完整匹配，则不注入。
- 因流式 Markdown 重新渲染而丢失的锚点，在下一次消息内容更新后按原指令恢复。

锚点使用广告服务的 `click_tracking_url` 作为 `href`，由跟踪服务完成记录并 `302` 跳转。链接以新窗口打开，并带 `noopener noreferrer sponsored`。视觉上使用可识别的文内超链接样式，但不改变段落排版。

## Small Card 渲染

Small Card 位于对应助手回答正文、来源列表之后，操作按钮之前。卡片使用现有 `max-w-3xl` 回答宽度，在消息内占满可用宽度：

- 卡片整体可点击，使用 `click_tracking_url` 作为跳转地址。
- 左侧为固定正方形图标，使用服务返回的 `icon_url`，图片保持 `1:1` 且使用 `object-cover`。
- 右侧为文字区：上方显示广告属性标识和单行加粗标题，下方显示最多两行描述。
- 卡片使用现有主题变量的边框、背景和文字色，支持浅色与深色模式。
- 图标加载失败时保留中性占位背景，不隐藏整张卡片。

## 曝光与点击监测

Native Text 锚点和 Small Card 共用曝光观察器：

1. 使用 `IntersectionObserver` 且阈值为 `0.5`。
2. 目标节点可见比例达到 50% 时启动 1 秒定时器。
3. 1 秒内低于阈值时取消定时器。
4. 连续满足条件后，使用非阻塞 `GET` 请求上报 `impression_tracking_url`。
5. 上报一次后立即停止观察并记录会话级去重键。Native Text 使用 `anchor_dom_id`，Small Card 使用 `ad_id`。

上报请求使用 `keepalive` 且不等待响应；失败不重试，不影响界面交互。

## 配置与安全边界

- Small Card 的服务基地址、广告位 ID 和接入 Key 仅供 Next.js 服务端使用。
- Native Text 由浏览器直连，其 WebSocket URL、广告位 ID 和接入 Key 必须作为公开前端配置。这与已批准的前端直连方案一致。
- 客户端不信任广告服务的任意数据；只接受 `http:` 或 `https:` 的图片、点击和监测 URL，Native Text 必须具备非空关键词和唯一锚点 ID。
- 当前项目与广告服务均使用本地 HTTP/WS。如项目改为 HTTPS 部署，广告服务必须同步提供 HTTPS/WSS，否则浏览器会拦截混合内容。

## 异常处理

- WebSocket 不可用：不再发送 Chunk，AI 流正常继续。
- WebSocket 指令非法或关键词不存在：忽略该指令。
- Small Card 超时、非 `200`、非法结构或 `ads` 为空：不渲染卡片。
- 图片不可用：显示占位背景，文本与点击功能保留。
- 曝光或点击监测失败：不向用户显示错误。

## 测试与验收

自动化测试将覆盖：

- 从连续更新的助手文本中只计算和发送新增 Chunk。
- WebSocket URL 参数、客户端帧和服务端指令校验。
- Native Text 只替换首个合法关键词，且不修改链接和代码内容。
- Small Card 代理的请求映射、真实响应解析、空广告与错误降级。
- 曝光阈值、1 秒延时、中途离开取消和单次上报。
- 回答完成后才拉取 Small Card，错误或中止时不拉取。

完成前执行 TypeScript 类型检查、全部自动化测试和 Next.js 生产构建。手工验收需要确认：

- AI 流式回答不被广告连接阻塞。
- 匹配到 Native Text 时，回答中出现可点击广告超链接。
- 匹配到 Small Card 时，卡片出现在对应回答末尾，布局在桌面和移动宽度下均正常。
- 无匹配、服务断开或返回错误时，聊天界面无错误占位且 AI 回答正常。
