# AI 广告接入指南

> 唯一广告数据来源是 `http://10.1.51.76:8080`。本项目不生成、不匹配、不存储广告素材。

## 1. 整体架构与数据来源

本项目接入广告平台的两个广告位：Small Card 和 Native Text。广告匹配、广告素材、落地页 URL、点击监测 URL、曝光监测 URL 均来自广告平台 `http://10.1.51.76:8080`；本项目只负责传输、校验、运行时渲染和监测触发，不会把广告数据写入聊天消息、Supabase 或 IndexedDB。

Small Card 使用同源服务端代理，原因是真实广告接口不支持浏览器 CORS 预检。该代理仅传输代理，不参与素材生成或匹配：

```text
浏览器 → 本项目 /api/ads/small-card（仅传输代理）
       → http://10.1.51.76:8080/api/v1/ad/query（广告匹配与素材来源）
```

Native Text 由浏览器直接连接广告平台：

```text
浏览器 → ws://10.1.51.76:8080/api/v1/ad/stream-match
```

所有广告失败都静默降级：连接失败、接口错误、字段非法、无匹配、图片加载失败、曝光或点击监测失败，都不得阻塞 AI 回答主链路或向用户显示错误占位。

## 2. 广告位配置

| 广告位 | ID | 名称 | 接入 Key | 端点 |
| --- | --- | --- | --- | --- |
| Small Card | `7` | `SmallCard-Test` | `cmrlha7j000011xywcsjy39x1` | `POST http://10.1.51.76:8080/api/v1/ad/query` |
| Native Text | `8` | `Native_Text-Test` | `cmrloph8700031xywuz5ijj94` | `ws://10.1.51.76:8080/api/v1/ad/stream-match` |

Small Card 代理请求同时发送 `X-Placement-Key`、`X-Publisher-Key` 和 `X-Ad-Slot-ID`。真实服务已验证会识别 `X-Placement-Key`；同时发送三者用于兼容现有协议约定。

Native Text WebSocket 已验证使用查询参数完成握手：

- `placement_key=cmrloph8700031xywuz5ijj94`
- `slot_id=8`
- `request_id=<本项目生成的请求 ID>`

## 3. Small Card 接入流程

Small Card 只在一次新的助手回答正常完成后请求一次。用户停止生成、AI 报错、接口超时或无广告时不渲染卡片。重新生成回答视为一次新回答，可以触发新的广告请求。

浏览器请求本项目同源接口：

```http
POST /api/ads/small-card
Content-Type: application/json

{
  "query": "用户问题",
  "language": "zh-CN"
}
```

本项目校验 `query` 非空且不超过消息最大长度，补充浏览器 `user-agent`，生成 `req_sc_<uuid>` 形式的 `request_id`，再请求广告平台：

```http
POST http://10.1.51.76:8080/api/v1/ad/query
Content-Type: application/json; charset=utf-8
X-Placement-Key: cmrlha7j000011xywcsjy39x1
X-Publisher-Key: cmrlha7j000011xywcsjy39x1
X-Ad-Slot-ID: 7

{
  "slot_id": "7",
  "request_id": "req_sc_<uuid>",
  "device": {
    "ua": "<浏览器 UA>",
    "language": "zh-CN"
  },
  "context": {
    "query": "用户问题",
    "keywords": []
  }
}
```

本项目只接受广告平台返回的第一条合法 Small Card，并向前端暴露：

- `ad_id`
- `creative.icon_url`
- `creative.title`
- `creative.description`
- `creative.badge_text`
- `landing_url`
- `click_tracking_url`
- `impression_tracking_url`

`icon_url`、`landing_url`、`click_tracking_url`、`impression_tracking_url` 必须是 `http:` 或 `https:` URL；标题、描述、徽标文本和 `ad_id` 必须非空。非法结构、非 `200` 响应、空 `ads` 或网络错误都会返回 `{ "ad": null }`。

Small Card 渲染在对应助手回答末尾。当前实现为半宽卡片（`w-1/2`），左侧正方形图标，右侧标题、广告属性标识和最多两行描述（`line-clamp-2`）。卡片跳转使用 `landing_url`，点击监测使用后台请求 `click_tracking_url`。

## 4. Native Text 接入流程

Native Text 直接连接：

```text
ws://10.1.51.76:8080/api/v1/ad/stream-match
```

一次助手回答对应一个 WebSocket 会话。生命周期如下：

1. AI 请求进入 `submitted` 时创建连接，尽量在首个回答 Chunk 前完成握手。
2. 流式回答期间，本项目计算助手文本增量，并按递增 `chunk_id` 发送 `text_chunk` 帧。
3. 收到广告平台 `inject_anchor` 指令后，校验字段并关联到当前助手消息。
4. 回答完成后关闭 WebSocket，并触发 Small Card 请求。
5. 用户停止生成、发生错误、切换会话或组件卸载时关闭连接并清理运行时状态。

客户端发送帧：

```json
{
  "event": "text_chunk",
  "data": {
    "chunk_id": 1,
    "text": "新增的助手回答文本",
    "timestamp": 1720000000000
  }
}
```

广告平台返回的 Native Text 指令必须符合：

```json
{
  "event": "inject_anchor",
  "data": {
    "ad_id": "ad-id",
    "keyword": "YNAB",
    "anchor_dom_id": "anchor-id",
    "landing_url": "https://example.com",
    "click_tracking_url": "https://example.com/click",
    "impression_tracking_url": "https://example.com/impression"
  }
}
```

`keyword`、`anchor_dom_id`、`ad_id` 必须非空；`landing_url`、`click_tracking_url` 和 `impression_tracking_url` 必须是 `http:` 或 `https:` URL。同一 `anchor_dom_id` 在同一消息中只保留一条指令。

Native Text 在渲染层注入锚点，不修改和持久化助手消息正文。英文关键词匹配大小写不敏感，锚点文字保留 AI 原文大小写；会跳过已有链接、`code`、`pre`、`script` 和 `style` 内容。

## 5. 高价值动态选位

Native Text 不再采用历史“第一个匹配即注入”的规则。当前高价值动态选位会扫描当前 Native Text 指令所属助手回答容器中的全部合法候选，并为每个候选确定性评分。

结构分只取最高项：

- `h1`–`h3`：40 分
- `strong`、`b`：30 分
- `h4`–`h6`：25 分
- 普通段落：10 分

上下文分：

- 购买、下单、价格、优惠、`buy`、`purchase`、`price`、`deal`：35 分
- 推荐、值得、首选、`recommend`、`worth`、`best`：25 分
- 适合、帮助、效果、`suitable`、`help`、`benefit`：20 分
- 位于回答全文前 20%–45%：15 分
- 候选所在句子后方已有句末标点：10 分
- 不推荐、不适合、避免、风险、注意、`not recommend`、`avoid`、`risk`、`caution`：减 30 分
- 位于 `blockquote` 或 `li`：减 15 分

流式阶段会立即选择当前最高分候选插入，但只有新候选比分数当前位置至少高 15 分时才移动，避免频繁跳动。回答结束后执行最终校准，不再要求 15 分阈值，只要候选分数更高就移动到全文最高分位置。移动时先把旧锚点还原为原始文本，再在新位置创建同一 `anchor_dom_id` 的锚点。

## 6. 跳转、点击与曝光监测

所有用户可见跳转都使用广告平台返回的 `landing_url`：

- Native Text 锚点 `href = landing_url`
- Small Card 卡片 `href = landing_url`

点击监测不作为跳转地址。本项目在点击时后台发起 `GET click_tracking_url`，使用 `keepalive`、`mode: "no-cors"`，不等待响应，不重试，失败静默忽略。

曝光监测规则：

1. 使用 `IntersectionObserver`，阈值为 `0.5`。
2. 目标元素可见比例达到 50% 时启动 1 秒定时器。
3. 1 秒内低于 50% 时取消定时器。
4. 连续满足 50%/1 秒后，后台 `GET impression_tracking_url`。
5. 单次会话内去重：Native Text 使用 `native-text:<anchor_dom_id>`，Small Card 使用 `small-card:<ad_id>`。

已完成曝光的 Native Text 即使后续因最终校准移动，也不会重复上报。

## 7. 本项目代码映射

| 领域 | 文件 | 职责 |
| --- | --- | --- |
| 类型 | `lib/ads/types.ts` | `NativeTextInstruction`、`SmallCardAd` 运行时数据结构 |
| Native Text 协议 | `lib/ads/native-text.ts` | WebSocket URL、Placement 配置、Chunk 帧、指令解析、完成态判断 |
| Small Card 协议 | `lib/ads/small-card.ts` | 上游请求映射、鉴权头、响应解析与 URL 校验 |
| Small Card API | `app/api/ads/small-card/route.ts` | 同源 `/api/ads/small-card` 仅传输代理、超时与静默降级 |
| Native Text 选位 | `lib/ads/dom.ts` | 候选收集、大小写不敏感匹配、评分、移动、最终校准 |
| 曝光与点击 | `lib/ads/impression.ts` | 50%/1 秒曝光、后台 GET 监测 |
| 广告生命周期 | `app/components/ads/use-chat-advertising.ts` | WebSocket 会话、文本增量、Small Card 拉取、运行时状态 |
| Native Text 渲染 | `app/components/ads/use-native-text-anchors.ts` | 调用动态选位并绑定曝光观察器 |
| Small Card 展示 | `app/components/ads/small-card-ad.tsx`、`lib/ads/presentation.ts` | 半宽、两行描述、`landing_url` 跳转、点击监测 |
| CSP | `middleware.ts` | 将 Native Text WebSocket origin 加入 `connect-src`，并将广告平台 HTTP origin 加入 `connect-src` / `img-src` |

## 8. 环境变量与 CSP

默认广告平台配置已内置，部署时可用环境变量覆盖：

| 变量 | 默认值 | 使用位置 |
| --- | --- | --- |
| `AD_SERVER_BASE_URL` | `http://10.1.51.76:8080` | Small Card 服务端代理 |
| `AD_CSP_EXTRA_ORIGINS` | 空 | 逗号分隔的额外广告 HTTP/HTTPS origin；开发模式默认额外允许 `http://localhost:8080` |
| `SMALL_CARD_PLACEMENT_ID` | `7` | Small Card 请求体与请求头 |
| `SMALL_CARD_PLACEMENT_KEY` | `cmrlha7j000011xywcsjy39x1` | Small Card 鉴权请求头 |
| `NEXT_PUBLIC_NATIVE_TEXT_WS_URL` | `ws://10.1.51.76:8080/api/v1/ad/stream-match` | 浏览器直连 Native Text |
| `NEXT_PUBLIC_NATIVE_TEXT_PLACEMENT_ID` | `8` | Native Text WebSocket 查询参数 |
| `NEXT_PUBLIC_NATIVE_TEXT_PLACEMENT_KEY` | `cmrloph8700031xywuz5ijj94` | Native Text WebSocket 查询参数 |

`middleware.ts` 会通过 `getNativeTextConnectSource()` 将 Native Text WebSocket 的 origin 加入 CSP `connect-src`，并通过 `getAdPlatformCspSources()` 将 `AD_SERVER_BASE_URL` 的 HTTP/HTTPS origin 加入 `connect-src` 与 `img-src`，用于点击/曝光追踪 GET 和 Small Card `icon_url`。本地开发额外允许 `http://localhost:8080`；其他测试源可用 `AD_CSP_EXTRA_ORIGINS` 覆盖。当前项目和广告服务使用 HTTP/WS；如果项目改为 HTTPS 部署，广告平台必须提供 HTTPS/WSS，否则浏览器会因混合内容策略拦截连接或图片。

## 9. 本地验证与排障

本地验证命令：

```bash
rg -n "唯一广告数据来源|10\\.1\\.51\\.76|高价值动态选位|landing_url|仅传输代理" docs/advertising-integration-guide.md docs/superpowers/specs/2026-07-15-ai-ad-placements-design.md docs/superpowers/plans/2026-07-15-ai-ad-placements.md
git diff --check
npm run type-check
npm test
npm run build
```

排障顺序：

1. Small Card 无展示：检查 `/api/ads/small-card` 是否返回 `{ "ad": null }`；再检查上游 `code`、`style`、`ads` 和 URL 字段是否合法。
2. Native Text 无链接：检查 WebSocket 是否连接到 `ws://10.1.51.76:8080/api/v1/ad/stream-match`，查询参数是否包含 `placement_key`、`slot_id=8`、`request_id`，并确认返回的是合法 `inject_anchor`。
3. 匹配位置不符合预期：检查关键词是否在跳过区域内；英文匹配忽略大小写，但不会跨多个 DOM 文本节点匹配。
4. 点击后未记录：确认页面跳转使用 `landing_url`，监测使用后台 `click_tracking_url`；点击监测失败不会改变用户跳转。
5. 曝光未记录：确认目标元素连续 1 秒至少 50% 可见，且单次会话没有被相同去重键上报过。
6. HTTPS 部署后 Native Text 失败：确认广告平台已提供 WSS/HTTPS，并将对应 origin 加入 CSP `connect-src`。
