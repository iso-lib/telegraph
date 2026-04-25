🎉基于R2储存的图床/视频床/文件床项目已完成，欢迎部署测试👉[JSimages](https://github.com/0-RTT/JSimages)

# Telegraph图床

基于 Cloudflare Worker 和 Pages 以及 Telegram Bot API 的图床/视频床/文件床服务

## 功能特点

### 核心功能
- 🔐 可选的访客验证功能（Basic Auth）
- 🗜️ 可选的图片压缩功能（默认开启，支持前端切换）
- 📦 可选的文件大小限制（默认 20MB，可通过环境变量配置）
- 📁 支持所有文件格式上传（图片、视频、文档等）
- 📤 支持多文件上传、拖拽上传和粘贴上传（Ctrl+V）
- 🔄 哈希校验避免重复上传

### 管理功能
- 📋 支持查看本地历史记录
- 🖼️ 图库管理界面，支持批量操作
- 🗑️ 支持批量删除文件（同步删除数据库记录和缓存）
- ⏰ 显示文件上传时间
- 📋 支持多种格式复制链接（URL、BBCode、Markdown）

### 性能优化
- ⚡ Cloudflare Cache API 缓存支持
- 🎨 懒加载和骨架屏优化
- 🌅 Bing 每日壁纸背景（自动轮播）
- 📱 响应式设计，支持移动端
- 🔁 自动重试机制（获取文件路径最多重试3次）

### 存储方式
- 📡 基于 Telegram Bot API 的文件存储
- 💾 使用 Cloudflare D1 数据库存储文件映射关系
- 🎯 通过 fileId 实现文件访问

## 更新日志

> **最近更新**: 2026-01-19
> - 使用Claude优化了一下代码

<details>
<summary>历史更新记录</summary>

### 2026-01-19
- 使用Claude优化了一下代码

### 2025-08-24
- 修复cdn.bytedance.com下线导致的页面加载异常的问题

### 2025-08-07
- 修复主页背景图片无法加载的问题

### 2024-12-18
- 更新管理界面样式
- 移除前端的文件类型和文件大小限制
- 通过环境变量控制上传文件的大小

### 2024-12-17
- 在前端新增一个压缩按钮，用于控制压缩功能，默认状态为开启。

### 2024-12-13
- 通过哈希校验来避免重复上传。
- 调整压缩率为0.75，同时去除分辨率限制。
- 给删除接口 `/delete-images` 添加了认证检查。

### 2024-11-29
#### 管理页面
- 新增全选和复制功能
- 删除前进行二次确认
- 优化资源加载逻辑
- 禁用视频文件自动播放
#### 首页
- 修复粘贴上传时不显示移除按钮的问题

### 2024-11-21日
- 优化上传体验，默认开启压缩，加快文件上传速度
  - 如需关闭，请将代码的238行修改为```enableCompression: false```

### 2024-11-01
- 修复上传后无法加载的问题

### 2024-10-19
- 修复webp无法上传的BUG
- 优化数据库结构，[查看迁移教程](https://github.com/0-RTT/telegraph/releases/tag/v2.0)

### 2024-09-29
- 优化缓存功能，采用 Cloudflare Cache API 缓存支持

### 2024-09-25
- 修复GIF文件上传的问题，感谢 [nodeseek](https://www.nodeseek.com/) 用户 [@Libs](https://www.nodeseek.com/space/7214#/general) 提供的思路
- Telegraph接口移到了telegraph分支，main分支为TG_BOT接口，可以通过直接fork仓库部署到pages

### 2024-09-23
- 修复链接失效的问题，支持视频文件上传

### 2024-09-14
- Telegraph接口上传的文件有**时效性**，建议使用TG_BOT上传

### 2024-09-13
- 支持通过TG_BOT上传到频道

### 2024-09-12
- 已修复，可正常上传到telegraph

### 2024-09-06
> ~~2024年9月6日起 telegra.ph 禁止了上传媒体文件，此项目终结。~~

</details>

## 部署步骤

### 1. 变量说明
需要在 Cloudflare Workers 中配置以下环境变量:

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| DOMAIN | 自定义域名 | 是 | example.workers.dev |
| DATABASE | D1 数据库绑定变量名称 | 是 | DATABASE |
| TG_BOT_TOKEN | Telegram Bot Token | 是 | 123456789:ABCdefGHIjklMNOpqrsTUVwxyz |
| TG_CHAT_ID | Telegram 频道/群组 ID | 是 | -100xxxxxxxxxx |
| USERNAME | 管理员用户名 | 是 | admin |
| PASSWORD | 管理员密码 | 是 | password123 |
| ADMIN_PATH | 管理后台路径 | 是 | admin |
| ENABLE_AUTH | 访客验证（设置为 true 开启，不设置或设置为 false 则关闭） | 否 | false |
| MAX_SIZE_MB | 单文件最大支持大小（单位：MB，默认值为 20） | 否 | 20 |

### 2. 创建 Telegram Bot
1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 命令创建新机器人
3. 按照提示设置机器人名和用户名
4. 保存获得的 Bot Token (格式为`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - 这个 Token 将用作环境变量 `TG_BOT_TOKEN`

### 3. 创建 Telegram 频道或群组
1. 创建一个新的频道或群组
2. 将你的 Bot 添加为管理员
3. 获取频道/群组 ID：
   - 发送频道内的任意消息给 [@getidsbot](https://t.me/getidsbot)
   - 在 Origin chat 下找到对应的 ID (格式为 `-100xxxxxxxxxx`)
   - 这个 ID 将用作环境变量 `TG_CHAT_ID`

### 4. 创建 D1 数据库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 `Workers & Pages` → `D1 SQL 数据库`
3. 点击 `创建` 创建数据库
   - 数据库名称可自定义，例如`images`
   - 建议选择数据库位置为 `亚太地区`，可以获得更好的访问速度
4. 创建数据表:
   - 点击数据库名称进入详情页
   - 选择 `控制台` 标签
   - 执行下 SQL 语句:
```sql
CREATE TABLE media (
    url TEXT PRIMARY KEY,
    fileId TEXT NOT NULL
);
```

### 5. 创建 Worker
1. 进入 `Workers & Pages`
2. 点击 `创建`
3. 选择 `创建 Worker`
4. 为 Worker 设置一个名称
5. 点击 `部署` 创建 Worker
6. 点击继续处理项目

### 6. 配置变量和机密
1. 在 Worker 的 `设置` → `变量和机密` 中
2. 根据需要逐个点击 `添加` 添加以下变量
   - DOMAIN
   - TG_BOT_TOKEN
   - TG_CHAT_ID
   - USERNAME
   - PASSWORD
   - ADMIN_PATH
   - ENABLE_AUTH（可选）
   - MAX_SIZE_MB（可选）
3. 点击 `部署`

### 7. 绑定数据库
1. 在 Worker 设置页面找到 `设置` → `绑定`
2. 点击 `添加` 添加以下变量名称
   - DATABASE
3. 点击 `部署`

### 8. 绑定域名
1. 在 Worker 的 `设置` → `域和路由`
2. 点击 `添加` → `自定义域`
3. 输入你在Cloudflare绑定的域名
4. 点击 `添加域`
5. 等待域名生效

### 9. 部署代码
1. 进入你的worker项目 → 点击编辑代码
2. 将 `_worker.js` 的完整代码复制粘贴到编辑器中
3. 点击 `部署`

## 开源协议

MIT License

## 💰赞助商

- [NodeSupport](https://github.com/NodeSeekDev/NodeSupport)
- [![yxvm_support.png](https://kycloud3.koyoo.cn/20250411e0a01202504111413152588.png)](https://yxvm.com/)
