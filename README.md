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
- 🎲 文件名 = 时间戳 + 随机串（64 位随机熵），不可枚举猜测，避免公开图床被扫链接

### 管理功能
- 📋 支持查看本地历史记录
- 🖼️ 图库管理界面，支持批量操作
- 🗑️ 支持批量删除文件（同步删除数据库记录、边缘缓存以及 R2 中的对象，老数据在 R2 中不存在时会自动跳过，不影响删除结果）
- ⏰ 显示文件上传时间
- 📋 支持多种格式复制链接（URL、BBCode、Markdown）

### 性能优化
- ⚡ Cloudflare Cache API 缓存支持
- 🪣 可选的 R2 缓存层：上传时自动双写一份到 R2，读取优先命中 R2；如绑定 R2 自定义域名，图片链接可直接指向该域名，读取流量完全不经过 Worker，不占用 Workers 每日请求配额（Free 计划 10 万次/天）
- 🕐 静态文件（图片/视频/文档等）缓存时间 1 年（immutable），大幅减少重复访问带来的请求消耗
- 🎨 懒加载和骨架屏优化
- 🌅 Bing 每日壁纸背景（自动轮播）
- 📱 响应式设计，支持移动端
- 🔁 自动重试机制（获取文件路径最多重试3次）

### 存储方式
- 📡 基于 Telegram Bot API 的文件存储（作为持久化源存储）
- 🪣 可选绑定 Cloudflare R2 作为读取加速层，减少对 Telegram 的重复请求
- 💾 使用 Cloudflare D1 数据库存储文件映射关系
- 🎯 通过 fileId 实现文件访问

## 更新日志

> **最近更新**: 2026-07-12
> - 上传文件名加入随机串（时间戳-随机串.扩展名），避免公开图床的链接被枚举/扫描猜出
> - 静态文件缓存时间由 30 天延长为 1 年（immutable），常量重命名为 `STATIC_FILE`，明确覆盖图片/视频/文档等所有类型
> - `wrangler.toml` 新增 `keep_vars = true`，防止 GitHub 集成等自动部署清空 Dashboard 里手动设置的环境变量和密钥

<details>
<summary>历史更新记录</summary>

### 2026-07-12
- 上传文件名加入随机串（时间戳-随机串.扩展名），避免公开图床的链接被枚举/扫描猜出
- 静态文件缓存时间由 30 天延长为 1 年（immutable），常量重命名为 `STATIC_FILE`，明确覆盖图片/视频/文档等所有类型
- `wrangler.toml` 新增 `keep_vars = true`，防止 GitHub 集成等自动部署清空 Dashboard 里手动设置的环境变量和密钥

### 2026-07-09
- 新增可选的 R2 缓存层：上传双写 R2、读取优先命中 R2、支持绑定 R2 自定义域名彻底绕开 Worker 请求配额
- 删除接口同步清理 R2 中的对象，兼容加 R2 之前上传的老数据（自动判断是否存在再删除）
- 图片缓存有效期由 1 天延长为 30 天，减少重复访问带来的请求消耗

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
| DOMAIN | 自定义域名（Worker 绑定的域名，作为老链接/fallback 使用） | 是 | example.workers.dev |
| DATABASE | D1 数据库绑定变量名称 | 是 | DATABASE |
| TG_BOT_TOKEN | Telegram Bot Token | 是 | 123456789:ABCdefGHIjklMNOpqrsTUVwxyz |
| TG_CHAT_ID | Telegram 频道/群组 ID | 是 | -100xxxxxxxxxx |
| USERNAME | 管理员用户名 | 是 | admin |
| PASSWORD | 管理员密码 | 是 | password123 |
| ADMIN_PATH | 管理后台路径 | 是 | admin |
| ENABLE_AUTH | 访客验证（设置为 true 开启，不设置或设置为 false 则关闭） | 否 | false |
| MAX_SIZE_MB | 单文件最大支持大小（单位：MB，默认值为 20） | 否 | 20 |
| BUCKET | R2 存储桶绑定变量名称（不配置则不启用 R2 缓存层，全部走原有 Telegram 逻辑） | 否 | BUCKET |
| R2_DOMAIN | 绑定到 R2 存储桶的自定义域名，配置后新上传的图片链接将直接指向该域名，读取不再经过 Worker | 否 | img.example.com |

> ⚠️ 通过 GitHub 集成等方式自动部署时，Wrangler 默认会用仓库里的 `wrangler.toml` 覆盖 Dashboard 手动设置的变量。本项目 `wrangler.toml` 已加上 `keep_vars = true` 防止这一行为，但首次部署前仍需在 Dashboard 里手动填好上述变量。

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

### 5. 创建 R2 存储桶（可选，用于降低 Workers 请求配额消耗）
> 不需要这个能力的话可以跳过本步骤，直接进行第 6 步，此时项目行为与不接入 R2 完全一致。

1. 进入 `R2` → `创建存储桶`，设置一个名称（例如 `telegraph-images`）
2. 进入桶的 `设置` 标签页，找到 `自定义域` 区块，点击 `添加`
3. 输入一个专门用于对外分发图片的子域名（建议跟 Worker 的域名区分开，例如 Worker 用 `pic.example.com`，R2 用 `img.example.com`），等待状态变为 `活动`
4. 记下这个域名，稍后作为环境变量 `R2_DOMAIN` 使用

> 📌 注意：R2 自定义域的 DNS 记录由 Cloudflare 自动创建和托管，不能像 Worker 路由那样自由改 CNAME 指向第三方"优选域名"做加速。如果需要针对国内访问做加速优化，只能在 Worker 路由层面操作。

### 6. 创建 Worker
1. 进入 `Workers & Pages`
2. 点击 `创建`
3. 选择 `创建 Worker`
4. 为 Worker 设置一个名称
5. 点击 `部署` 创建 Worker
6. 点击继续处理项目

### 7. 配置变量和机密
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
   - R2_DOMAIN（可选，第 5 步创建了 R2 才需要）
3. 点击 `部署`

### 8. 绑定数据库和存储桶
1. 在 Worker 设置页面找到 `设置` → `绑定`
2. 点击 `添加` 添加以下绑定
   - 类型选择 `D1 数据库`，变量名称填 `DATABASE`
   - 如果做了第 5 步，再添加一个绑定，类型选择 `R2 存储桶`，变量名称填 `BUCKET`，选择对应的桶
3. 点击 `部署`

### 9. 绑定域名
1. 在 Worker 的 `设置` → `域和路由`
2. 点击 `添加` → `自定义域`
3. 输入你在Cloudflare绑定的域名
4. 点击 `添加域`
5. 等待域名生效

### 10. 部署代码
1. 进入你的worker项目 → 点击编辑代码
2. 将 `_worker.js` 的完整代码复制粘贴到编辑器中
3. 点击 `部署`

> 如果使用 GitHub 集成自动部署，请确认仓库中的 `wrangler.toml` 已包含 `keep_vars = true`，避免每次推送代码都清空 Dashboard 里配置的变量和密钥。

## 安全说明

- 上传后的文件名由时间戳和随机串组成（例如 `1783590925303-a1b2c3d4e5f60718.jpg`），随机串具备 64 位熵，不依赖"链接猜不到"之外的额外鉴权即可抵御批量枚举/扫描。
- 图片/文件读取接口本身不做访问鉴权（符合无需登录的公共图床定位），如果需要限制访问范围，建议自行在 Worker 中补充白名单、限流或访问日志。
- 管理后台（`ADMIN_PATH`）、上传（`/upload`）、删除（`/delete-images`）接口均受 `USERNAME`/`PASSWORD` 保护，请使用强密码。

## 开源协议

MIT License

## 💰赞助商

- [NodeSupport](https://github.com/NodeSeekDev/NodeSupport)
- [![yxvm_support.png](https://kycloud3.koyoo.cn/20250411e0a01202504111413152588.png)](https://yxvm.com/)
