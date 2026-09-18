---
name: agnes-ai
description: >
  Call Agnes AI APIs for image recognition, text-to-image, image-to-image, and video generation.
  Use this skill whenever the user asks to: generate/create/draw/edit/transform images via AI,
  analyze/describe/understand/recognize the content of an image (image recognition / vision),
  generate/create videos from text or images, reverse-engineer a prompt from an image,
  or any request involving "AI绘画", "AI生图", "文生图", "图生图", "生成图片", "画一个",
  "把这张图变成", "识别图片", "图片理解", "图片分析", "生成视频", "文生视频", "图生视频",
  "agnes", or any Agnes AI image/video task.
  Also use when the user mentions Agnes AI in any context.
---

# Agnes AI — 全模态 API 技能

Agnes AI 免费提供三大模态 API：**图像识别（Vision）**、**图像生成**、**视频生成**。全部兼容 OpenAI 格式，Base URL 为 `https://apihub.agnes-ai.com/v1`。

## API 配置

| 配置项 | 值 |
|--------|-----|
| Base URL | `https://apihub.agnes-ai.com/v1` |
| 认证 | `Authorization: Bearer <API_KEY>` |
| API Key | `sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq` |
| 格式 | 完全兼容 OpenAI SDK |

## 模型总览

| 模型 | 能力 | 端点 |
|------|------|------|
| `agnes-2.0-flash` | 文本对话 + **图像识别/理解 (Vision)** + 代码 + 工具调用，1M 上下文 | `/v1/chat/completions` |
| `agnes-image-2.1-flash` | 文生图（高信息密度优化）+ 图生图 | `/v1/images/generations` |
| `agnes-image-2.0-flash` | 图生图专精 + 多图合成 + seed 复现 | `/v1/images/generations` |
| `agnes-video-v2.0` | 文生视频 + 图生视频 + 多图视频 + 关键帧动画 | `/v1/videos` (异步) |

---

# 一、图像识别 / 视觉理解 (Vision)

用 `agnes-2.0-flash` 的 Chat Completions 接口理解图片内容 — 描述画面、识别文字、逆向生成 prompt 等。

- **端点：** `POST https://apihub.agnes-ai.com/v1/chat/completions`
- **模型：** `agnes-2.0-flash`
- 支持 `image_url` 类型的 content，一次可传多张图片，配合 1M 上下文窗口分析长文档+图片。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | ✅ | `agnes-2.0-flash` |
| `messages` | array | ✅ | 消息列表，`content` 用数组格式混合 text 和 image_url |

### 典型用例

| 场景 | 说明 |
|------|------|
| 图片内容描述 | "描述这张图片的内容" |
| 反向提示词 | "分析这张图片并生成可复现该图的 prompt" |
| OCR / 文字识别 | "提取图片中的文字" |
| 图文联合理解 | 同时传文档+图片，综合分析 |

### 示例：分析图片内容

```bash
curl -X POST https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-2.0-flash",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "请详细描述这张图片里的内容，包括主体、场景、风格和色调"},
        {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
      ]
    }]
  }'
```

### 示例：从图片逆向生成 prompt

```bash
curl -X POST https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-2.0-flash",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "分析这张图片，生成一个可用于AI绘图的详细prompt，包含主体、场景、风格、光线、构图、画质六个要素。同时再给一个简洁版。"},
        {"type": "image_url", "image_url": {"url": "https://example.com/artwork.jpg"}}
      ]
    }]
  }'
```

### 响应格式（Chat Completions）

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "model": "agnes-2.0-flash",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "这张图片展示了..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 250,
    "completion_tokens": 180,
    "total_tokens": 430
  }
}
```

---

# 二、文生图 (Text-to-Image)

从文字描述生成图片。

- **端点：** `POST https://apihub.agnes-ai.com/v1/images/generations`
- **推荐模型：** `agnes-image-2.1-flash`

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | ✅ | `agnes-image-2.1-flash` 或 `agnes-image-2.0-flash` |
| `prompt` | string | ✅ | 详细图片描述 |
| `size` | string | ❌ | `1024x1024`（默认）、`1024x768`、`768x1024`、`768x768` |
| `n` | number | ❌ | 生成数量，默认 1，最大 4 |
| `seed` | number | ❌ | 随机种子（2.0-flash 支持，用于复现） |
| `extra_body.response_format` | string | ❌ | 设为 `url` 获取图片直链 |

### 示例

```bash
curl -X POST https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "A serene Japanese garden with a red bridge over a koi pond, cherry blossoms in full bloom, golden hour light, cinematic quality",
    "size": "1024x1024",
    "n": 1,
    "extra_body": {"response_format": "url"}
  }'
```

---

# 三、图生图 (Image-to-Image)

基于已有图片进行编辑或风格转换。输入图片需要**公网 URL**。

- **端点：** `POST https://apihub.agnes-ai.com/v1/images/generations`
- **推荐模型：** `agnes-image-2.0-flash`

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | ✅ | `agnes-image-2.0-flash`（推荐）或 `agnes-image-2.1-flash` |
| `prompt` | string | ✅ | 描述要改什么 + 保留什么 |
| `extra_body.image` | array | ✅ | 输入图片 URL 数组，可单张或多张 |
| `tags` | array | ❌ | 2.0-flash 时必须加 `["img2img"]` |
| `strength` | number | ❌ | 编辑力度 0-1，默认 0.7 |
| `extra_body.response_format` | string | ❌ | 设为 `url` |

### strength 选择指南

| 力度 | 适用场景 |
|------|----------|
| 0.3-0.5 | 微调：颜色调整、小修小补 |
| 0.5-0.7 | 中等：风格迁移 |
| 0.7-1.0 | 大胆：大幅改动 |

### 示例

```bash
curl -X POST https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.0-flash",
    "prompt": "Transform this photo into a watercolor painting style while preserving the main subjects and composition",
    "tags": ["img2img"],
    "strength": 0.7,
    "extra_body": {
      "image": ["https://example.com/input.jpg"],
      "response_format": "url"
    }
  }'
```

### 图像生成响应格式

```json
{
  "created": 1774432125,
  "data": [{ "url": "https://cdn.agnes-ai.com/output/xxxxx.png" }],
  "usage": { "generated_images": 1 }
}
```

生成的图片 URL 是临时的，**必须立即下载**。

---

# 四、视频生成 (Video Generation)

支持文生视频、图生视频、多图视频、关键帧动画四种模式。**异步接口**，需要创建任务后轮询。

- **端点（创建任务）：** `POST https://apihub.agnes-ai.com/v1/videos`
- **端点（查询结果）：** `GET https://apihub.agnes-ai.com/v1/videos/{task_id}`
- **模型：** `agnes-video-v2.0`

### 创建任务参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | ✅ | `agnes-video-v2.0` |
| `prompt` | string | ✅ | 视频内容文本描述 |
| `image` | string/array | 图生视频时 ✅ | 输入图片 URL |
| `mode` | string | ❌ | `ti2vid`（文生视频）或 `keyframes`（关键帧） |
| `width` | integer | ❌ | 视频宽度，默认 1152 |
| `height` | integer | ❌ | 视频高度，默认 768 |
| `num_frames` | integer | ❌ | 视频总帧数（见下方约束） |
| `frame_rate` | number | ❌ | FPS，默认 24，范围 1-60 |
| `seed` | integer | ❌ | 随机种子（复现用） |
| `negative_prompt` | string | ❌ | 负向提示词 |
| `extra_body.image` | array | 多图/关键帧时 ✅ | 输入图片 URL 数组 |
| `extra_body.mode` | string | 关键帧时 ✅ | `"keyframes"` |

### num_frames 约束（重要！）

必须同时满足两个条件：
1. `num_frames ≤ 441`
2. `num_frames = 8n + 1`（n 为正整数）

**有效值：** 81, 121, 161, 201, 241, 281, 321, 361, 401, 441

### 时长计算

`视频秒数 = num_frames / frame_rate`

| 目标时长 | num_frames | frame_rate |
|----------|------------|------------|
| ~3 秒 | 81 | 24 |
| ~5 秒 | 121 | 24 |
| ~7 秒 | 161 | 24 |
| ~10 秒 | 241 | 24 |
| ~18 秒 | 441 | 24 |

### 异步工作流

**第 1 步 — 创建视频任务：**

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "A cat walking through a neon-lit cyberpunk alley at night, cinematic camera pan, rain reflections on the ground",
    "width": 1152,
    "height": 768,
    "num_frames": 121,
    "frame_rate": 24
  }'
```

**任务创建响应：**

```json
{
  "id": "task_xxx",
  "task_id": "task_xxx",
  "status": "queued",
  "progress": 0
}
```

**第 2 步 — 轮询任务状态（每隔 10-15 秒）：**

```bash
curl -s https://apihub.agnes-ai.com/v1/videos/task_xxx \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq"
```

**任务状态一览：**

| 状态 | 含义 | 操作 |
|------|------|------|
| `queued` | 排队中 | 继续轮询 |
| `in_progress` | 生成中 | 继续轮询 |
| `completed` | 完成 | 从 `remixed_from_video_id` 下载视频 |
| `failed` | 失败 | 查看 `error` 字段，调整后重试 |

**完成后的响应：**

```json
{
  "id": "task_xxx",
  "status": "completed",
  "progress": 100,
  "remixed_from_video_id": "https://storage.agnes-ai.com/video_xxxxx.mp4"
}
```

视频 URL 在 `remixed_from_video_id` 字段中，同样需要**及时下载**。

### 图生视频示例

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer sk-qllEpN7b4AOf1VY4YBWT96Hy7DZAW28wgtSYCOnAKvntEJwq" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "The person in the image turns their head and smiles, gentle breeze blowing their hair, natural lighting",
    "image": "https://example.com/portrait.jpg",
    "width": 1152,
    "height": 768,
    "num_frames": 121,
    "frame_rate": 24
  }'
```

---

# 模型选择速查

| 用户需求 | 使用模型 | 端点 |
|----------|----------|------|
| 分析/描述图片内容 | `agnes-2.0-flash` | `/v1/chat/completions` |
| 从图片反推 prompt | `agnes-2.0-flash` | `/v1/chat/completions` |
| OCR / 识别图中文字 | `agnes-2.0-flash` | `/v1/chat/completions` |
| 从零生成图片 | `agnes-image-2.1-flash` | `/v1/images/generations` |
| 编辑/修改已有图片 | `agnes-image-2.0-flash` | `/v1/images/generations` |
| 多图合成为一张 | `agnes-image-2.0-flash` | `/v1/images/generations` |
| 文生视频 | `agnes-video-v2.0` | `/v1/videos` |
| 图生视频 | `agnes-video-v2.0` | `/v1/videos` |
| 关键帧动画 | `agnes-video-v2.0` + `extra_body.mode: "keyframes"` | `/v1/videos` |

---

# Prompt 写作指南

**文生图：** `[主体] + [场景] + [风格] + [光线] + [构图] + [画质]`

**图生图：** 明确"改什么"和"保什么"，调整 `strength` 控制力度。

**文生视频：** `[主体] + [动作] + [场景] + [镜头运动] + [光线] + [风格]`

**图生视频：** 描述哪些部分该动起来，哪些保持不变。

**图像识别：** 明确任务 — "描述内容" / "提取文字" / "分析风格" / "生成prompt"。

---

# 错误处理

| 场景 | 处理 |
|------|------|
| 图像识别/对话报错 | 检查 model 名是否正确（`agnes-2.0-flash`） |
| 图生图报错 | 检查是否加 `tags: ["img2img"]`、图片 URL 是否公网可访问 |
| 视频 num_frames 报错 | 确认值满足 `8n+1` 且 ≤441 |
| 视频 401 错误 | 检查 API Key |
| 视频 404 错误 | 确认 task_id 正确 |
| 生成的图片/视频 URL 失效 | 正常，需立即下载 |
