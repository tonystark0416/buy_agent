# buy_agent 项目需求文档

> 本文档是 buy_agent 项目唯一的需求与迭代追踪文档。每次迭代必须同步更新本文档正文与 Change Log，否则视为迭代未完成。

- 文档版本：v1.18
- 更新日期：2026-11-24
- 维护人：liuweizhao（AI 辅助迭代）
- 仓库：https://github.com/tonystark0416/buy_agent.git（本地路径 `/Users/liuweizhao/Desktop/buy_agent`，分支 `main`；**自 v1.8 起为 monorepo，含后端 + 后台前端 + C 端小程序，见 2.1 目录结构**）

---

## 1. 项目概述

buy_agent 是一个**多平台 CPS（按成交计费）导购返佣聚合后端服务**，为前端小程序/H5 提供：

1. 聚合多个电商平台（唯品会、拼多多、淘宝、京东）与本地生活平台（美团）的商品搜索、商品详情、推广转链能力；
2. 用户体系（微信 openid + 手机号）与 JWT 登录态；
3. CPS 佣金订单的拉取、入库与查询（用户收益明细）；
4. 运营位能力（首页 Banner、礼品券、首页多 tab 商品流）；
5. 后台管理（订单/用户/选品查询与管理，`/api/admin` + `admin-web/`）。

**目标用户**：通过微信小程序使用导购服务的 C 端用户；管理 Banner/选品的运营人员。

**当前状态**（2026-11-15 v1.9 整治后）：核心链路（登录、搜索、详情、转链、订单）已上线可用；淘宝、京东平台服务已实现但尚未接入路由（预留）；~~AI 聊天~~已整体下线（需求重启时从 git 历史找回）；C 端响应格式统一为 v2（`{code,msg,data}`，版本协商兼容旧版小程序）。2026-11-15 起「值物」微信小程序前端并入本仓库（`clients/wechat-miniprogram/`），后续迭代 iOS / Android 原生 App 也将放在 `clients/` 下。

**文档体系**：本文档是全项目唯一的需求与迭代追踪文档；根目录 `README.md` 是仓库入口（结构地图 / 快速启动 / 部署 / 迭代约定，结构性信息以 README 为准，业务需求以本文档为准）。小程序端的详细需求与 Change Log 保留在 `clients/wechat-miniprogram/REQUIREMENTS.md`（随代码同仓维护），涉及小程序的迭代需**同步更新两处**：本文档（项目级 Change Log 记一条）+ 小程序详细文档（正文与 Change Log）。

---

## 2. 技术架构

| 项 | 说明 |
|---|---|
| 运行时 | Node.js + Express 5（`app.js` 装配中间件与路由，`server.js` 启动监听，默认端口 `PORT` 或 3000） |
| 数据库 | MySQL（`mysql2/promise` 连接池，`utils/database.js`，`dateStrings: true`） |
| 认证 | JWT（`jsonwebtoken`，C 端 1h / 后台 8h，密钥均走 .env）+ 密码哈希（`bcryptjs`） |
| 订单同步 | `job/` CLI 脚本手动执行（`npm run sync:vip` / `sync:meituan`），cron 定时未启用（B-3） |
| 配置 | `config/config.js` 读取 `.env`（dotenv），敏感项与 CPS 业务标识集中收敛，必需项缺失启动即报错 |
| 分层 | `routes → controllers → services → models / services/platforms（各平台 API 封装）+ services/adapters（字段映射）` |

### 目录结构

```
├── app.js                 # 应用装配（路由注册、JSON 解析、错误处理）
├── server.js              # HTTP 启动入口
├── config/config.js       # 环境变量配置（DB / 各平台 CPS 密钥 / 微信）
├── middleware/            # 中间件（adminAuth：后台 JWT 鉴权）
├── routes/                # 路由层（12 个模块）
│   ├── admin/             # 后台管理路由（订单/用户查询，统一 /api/admin 前缀）
│   └── life/              # 本地生活（美团）
├── controllers/           # 控制器层（参数解析、调 service、返回）
│   └── admin/             # 后台管理控制器
├── services/              # 业务服务层（聚合、格式化、统一出参）
│   ├── admin/             # 后台管理服务（登录/订单/用户）
│   └── platforms/         # 平台适配层：vip / pdd / taobao / jd / meituan / weixin
├── models/                # 数据访问层：adp_user / adp_order / adp_banner / adp_goods / verification_codes
│   └── admin/             # 后台管理数据访问（admin_user / adp_order / adp_user 管理侧查询）
├── admin-web/             # 后台管理前端工程（Vue3 + Vite + Element Plus，独立 package.json）
├── clients/               # C 端客户端（2026-11-15 新增）
│   ├── wechat-miniprogram/  # 值物微信小程序（原 huigenghao 仓库并入，原生小程序，详细需求见其内 REQUIREMENTS.md）
│   ├── ios/                 # 预留：未来 iOS 原生 App
│   └── android/             # 预留：未来 Android 原生 App
├── job/                   # 订单同步任务：vipOrderSync / meituanOrderSync
├── utils/                 # database 连接池 / meituan 签名 / 时间工具
├── sql/init.sql           # 建表脚本
├── sql/admin.sql          # 后台管理员表 DDL + 种子账号（2026-09-30 新增）
└── test.js                # 临时测试脚本
```

---

## 3. 功能模块与需求详述

### 3.1 用户与认证模块（/api/user、/api/weixin）

**需求描述**：支持微信小程序用户以最小摩擦方式注册/登录，获得 JWT 供后续接口使用。**登录主流程（2026-11-15 起）**：启动时 wx.login → openid → `loginByOpenid` 查 uid，已绑定直接登录；未绑定走微信手机号一键授权 → `register` 注册/登录并自动完成 uid+openid 绑定。

| API | 方法 | 说明 |
|---|---|---|
| `/api/user/register` | POST | 注册/登录一体：手机号已存在则直接登录并回填 openid；支持"手机号+密码"、"手机号+openid"、"纯手机号"三种注册方式；密码最少 6 位 |
| `/api/user/login` | POST | 手机号 + 密码登录（bcrypt 校验） |
| `/api/user/loginByOpenid` | POST | openid 登录（openid 未绑定账号时报错） |
| `/api/user/sendVerificationCode` | POST | **发送手机验证码**（预留 iOS/Android App 端；未配置 SMS 服务商时验证码仅打服务端日志并透出 `devCode` 供联调；60s 重发冷却） |
| `/api/user/loginByCode` | POST | **手机号+验证码登录**（预留 iOS/Android App 端；未注册自动注册；携带 openid 时自动绑定；验证码一次性使用防重放） |
| `/api/weixin/openid` | GET | 通过 wx.login code 换取 openid |
| `/api/weixin/getPhone` | GET | 通过 code 获取用户微信手机号 |

**业务规则**：
- 手机号唯一（`uk_phone`）；openid 与用户一对一绑定，但 `register` 接口**不校验 openid 是否已被其他用户绑定**，会直接覆盖（风险见 P2-3）；`loginByOpenid` 仅在 openid 未绑定时返回错误；
- 注册成功即签发 JWT（含 userId、phone，1 小时有效期）；
- 手机号已注册时调用注册接口视为登录，并静默更新 openid；若入参 `openid` 为空字符串/null，会把该用户已绑定的 openid 清空（建议对空值做判断，见 P2-3）；
- 验证码通道（2026-11-15 新增，App 预留）：验证码 5 分钟有效、6 位数字、一次性使用、同号 60s 重发冷却；当前为**单实例内存存储**（Map），多实例部署需迁移 Redis/DB；未配置 `SMS_PROVIDER` 时 `sendVerificationCode` 响应附 `devCode`（仅限开发联调，生产接入短信服务商后自动关闭）。**2026-11-23 联调期过渡**：`loginByCode` 接受固定验证码 `000000`（跳过验证码库校验，可注册可登录），供 App/小程序在短信服务商接入前体验——**接通 SMS 后必须移除该分支**（代码内已留 TODO 标记）。

**数据表**：`adp_user`（id、phone、password、nickname、avatar、**openid（2026-11-15 补列，此前物理缺失导致 openid 登录恒失败，见 P1-4）**）。

### 3.2 第三方授权模块（/api/thirdAuth）

**需求描述**：CPS 返佣要求用户在第三方平台完成推广授权备案，本模块生成授权链接并查询授权状态。

| API | 方法 | 说明 |
|---|---|---|
| `/api/thirdAuth/genAuthUrl` | GET | 生成授权链接（支持 pdd / vip），返回 h5_url、weapp_url、deeplink_url |
| `/api/thirdAuth/checkAuth` | GET | 检查授权状态，返回 `{ isAuth: true/false }` |
| `/api/thirdAuth/unbind` | GET | 解绑第三方授权（2026-10-03 新增）：仅支持 vip，调 `vipService.unbindOpenId(uid)`，非 vip 平台返回"不支持的平台" |

### 3.3 聚合搜索模块（/api/search）

**需求描述**：一次关键词搜索同时返回唯品会 + 拼多多商品，统一出参格式供前端渲染。

| API | 方法 | 说明 |
|---|---|---|
| `/api/search` | GET | 多平台聚合搜索：keyword、page、pageSize、uid、pid、sources（默认 `['vip','pdd']`）、activity_tags |

**统一出参**：`{ id, title, price, imageUrl, commission, platform }`，其中 vip 用 goodsId/vipPrice，pdd 用 goods_sign/min_group_price。

### 3.4 商品详情模块（/api/goods/getDetail）

**需求描述**：按平台 + 商品 ID 获取统一格式的商品详情（含价格、佣金、图集、标签）。

- 支持平台：vip（getGoodsMarketPrice）、pdd（goods_detail）；
- 出参统一为：platform、goodsId、goodsName、images、prices（marketPrice/salePrice/couponPrice）、commission（rate/amount）、tags、brandName/description；
- platform 与 goodsId 必传，缺失报错。

### 3.5 推广转链模块（/api/tranUrl）

**需求描述**：将第三方平台原始链接或商品 ID 转换为携带用户推广参数（pid/chanTag）的推广链接，是佣金归因的核心。

| API | 方法 | 说明 |
|---|---|---|
| `/api/tranUrl` | GET | 按原始 URL 转链：自动识别链接中的 `pinduoduo` / `vip.com` 域名分发，vip / pdd 均可用（pdd 分支 2026-10-05 恢复）；**两平台转链前均先校验授权状态**，未授权返回 `{ code: -1, needAuthPlatform: 'pdd'/'vip', message: '用户未授权' }`；响应码统一：`code: 200` 成功 / `-1` 未授权 / `-2` 不支持平台；必传参数为 `uid + source_url`（pid 不再必传，pdd `pid` 与 vip `chanTag` 缺省用代码内默认值，见 P2-5） |
| `/api/tranUrl/genUrlByGoodsId` | GET | 按商品 ID 转链：支持 vip / pdd；返回 goodsId + urls{ h5_url, weapp_url, weapp_source_id, weapp_app_id, deeplink_url, command }。pdd 走 `pdd.ddk.goods.promotion.url.generate`，vip 走 genByGoodsId |

**注意（2026-09-20）**：按商品 ID 转链的 pdd 分支中 `pid` 写死为 `43384525_317172887`，vip 分支的小程序 `weapp_source_id`（gh_8ed2afad9972）/`weapp_app_id`（wxe9714e742209d35f）写死在代码中，见问题清单 P2-5。

### 3.6 首页列表模块（/api/indexList）

**需求描述**：首页分 Tab 聚合内容流。

| Tab | 内容 | 数据源 |
|---|---|---|
| 1 | 精选商品（唯品会好货频道） | vipService.goodsListV2，jxCode=`dz5d5n7i` |
| 2 | 本地生活到店商品（今日必推） | meituanService.getGoodsInfo（platform=2 到店业务，listTopiId=2，需经纬度） |
| 3 | 拼多多运营选品（2026-09-20 新增） | `adp_goods` 表（models/adpGoodsModel.selectGoodsList，查询 platform='pdd' 的运营入库商品）；**不支持分页与经纬度/uid/pid 参数，返回当前平台所有选品** |

### 3.7 Banner 运营位模块（/api/banner）

| API | 方法 | 说明 |
|---|---|---|
| `/api/banner` | GET | 运营 Banner（type=2，按 sort 倒序） |
| `/api/banner/indexBannerList` | GET | 首页 Banner 列表（type=1），含跳转链接配置（近期已扩展 link options） |

**数据表**：`adp_banner`（type 区分位置，sort 排序）。

### 3.8 礼品券模块（/api/giftCoupons）

| API | 方法 | 说明 |
|---|---|---|
| `/api/giftCoupons` | GET | 调唯品会 createGiftCoupon 为商品创建礼品券（goodsId 必传，支持 giftName、amount、totalCount、活动时间、领取限制等参数） |

### 3.9 订单模块（/api/order + job/）

**需求描述**：定时拉取各平台 CPS 订单，统一入库，供用户查询自己的佣金/订单明细。

| API | 方法 | 说明 |
|---|---|---|
| `/api/order/getList` | GET | 按 uid + platform 分页查询订单（每页 10 条，按 create_time 倒序），返回 list/total/totalPages |

**数据表**：`adp_order`（order_sn、uid、goods_id、goods_name、goods_img_url、status、platform、order_amount、commission、create_time、update_time）。

**同步任务（job/）**：
- `vipOrderSync.js`：唯品会订单拉取。核心逻辑为"按小时区间分片拉取 + 分页 + 去重 + 存在即更新/不存在即插入"；cron 定时调度代码已写好但**当前被注释**，脚本以一次性日期范围补拉方式运行（脚本末尾 IIFE 补拉区间当前为 `2026-09-26 ~ 2026-09-30`，随提交 `2aecaf8` 更新）；
- `meituanOrderSync.js`：美团订单拉取，逻辑同上（订单 uid 取美团侧 sid，时间为秒级时间戳换算北京时间）；脚本末尾 IIFE 仍写死补拉区间 `2026-09-01 ~ 2026-09-12`，截至 2026-09-29 未调整。

### 3.10 本地生活（美团）模块（/api/meituan）

| API | 方法 | 说明 |
|---|---|---|
| `/api/meituan/goods` | GET | 商品列表（query_coupon）；2026-10-01 起完整透传搜索/筛选参数：searchText、经纬度、分页、searchId、sortField、productViewSignList、listTopiId、platform、**vpSkuViewIds**（唯品会侧 sku 召回，单值入参包装为单元素数组） |
| `/api/meituan/goodsDetail` | GET | 按商品查询单个商品信息（productViewSignList 入参，2026-10-01 新增） |
| `/api/meituan/referral-link-by-goods-id` | GET | 按商品 ID 获取推广链接 |
| `/api/meituan/referral-link-by-act-id` | GET | 按活动 ID 获取推广链接 |
| `/api/meituan/order-info` | GET | 查询订单信息（亦被同步任务复用） |

签名工具：`utils/meituan-sign-util.js`。
注意：`meituanService.getGoodsInfo` 中 `productViewSignList:[productViewSignList]`、`vpSkuViewIds:[vpSkuViewIds]` 在参数未传时会生成 `[null]`（见问题清单 P3-3），当前美团接口容忍空值，尚未修复。

### 3.11 ~~AI 导购对话模块（/chat）~~（已下线，模块已删除）

> **2026-11-15（v1.9）**：按用户决定，AI 聊天功能整体下线，`routes/agentRoutes.js`、`controllers/agentController.js`、`services/aiService.js` 三件套已从代码删除，`openai` 依赖已卸载（Backlog B-7 关闭）。以下为历史设计存档，需求重启时从 git 历史找回。

**需求描述**：用户以自然语言表达购物意图，AI 自动调用平台搜索工具并流式返回推荐内容。

- 模型：DeepSeek（OpenAI 兼容协议，`deepseek-v4-pro`，流式输出）；
- 工具：`search_vip_goods`（关键词搜索唯品会商品）；
- 事件回调：`token`（增量文本）、`tool_calls`、`status`（如"正在唯品会搜索..."）、`done`、`error`；
- 下线前状态：原型/演示阶段——工具调用的 openid/chanTag 写死为占位值，仅接了唯品会一个工具；`/chat` 路由自 2026-10-01 起注释下线（`44b1298`）。

### 3.12 后台管理模块（/api/admin + admin-web/，2026-09-30 新增）

**需求描述**：为运营/开发者提供后台查询订单与用户信息的能力。后端在本服务内以 `/api/admin/*` 路由组隔离实现（不改动既有业务代码，`app.js` 仅新增 2 行挂载）；前端为同仓子目录 `admin-web/`（Vue3 + Vite + Element Plus，独立依赖），开发期经 vite 代理联调。

| API | 方法 | 鉴权 | 说明 |
|---|---|---|---|
| `/api/admin/auth/login` | POST | 否 | 管理员登录（username + password，bcrypt 校验），签发独立 JWT（`ADMIN_JWT_SECRET`，8h，payload 含 type='admin'，与 C 端密钥隔离） |
| `/api/admin/auth/profile` | GET | 是 | 当前管理员信息 |
| `/api/admin/order/list` | GET | 是 | 订单多条件分页查询：platform（逗号分隔多选）、status、orderSn 精确、goodsName 模糊、uid、startTime/endTime 区间、sortField/sortOrder（白名单排序）；pageSize 上限 100 |
| `/api/admin/order/detail` | GET | 是 | 订单详情 + 关联用户信息 |
| `/api/admin/order/sync` | POST | 是+写权限 | **手动同步订单**（2026-11-16 新增）：{ platform: 'vip'\|'meituan', startDate, endDate }（YYYY-MM-DD，最长 30 天，不允许未来日期）；异步任务模式，立即返回 taskId；同平台互斥（400），异平台可并行；入库按 order_sn upsert 幂等 |
| `/api/admin/order/sync/status` | GET | 是 | 同步任务状态：传 taskId 查单任务（status: running/success/failed + progress 逐小时分段进度 + result 入库统计）；不传返回最近 20 条任务列表 + maxRangeDays |
| `/api/admin/user/list` | GET | 是 | 用户分页查询：phone 模糊、id 精确、openid 精确；**任何用户查询均不返回 password 字段** |
| `/api/admin/user/detail` | GET | 是 | 用户详情 + 按平台订单汇总（订单数/金额/佣金） |
| `/api/admin/goods/list` | GET | 是 | 运营选品分页查询（adp_goods 表）：platform 筛选（pdd/vip/meituan 白名单）、goodsName 模糊搜索（2026-10-01 新增） |
| `/api/admin/goods/create` | POST | 是+写权限 | 新增运营选品：goods_name/platform/goods_platform_id 必填，价格非负数字、图片 URL 须 http(s) 开头（长度均按表结构限制） |
| `/api/admin/goods/update` | PUT | 是+写权限 | 编辑选品（按 id，支持部分字段更新） |
| `/api/admin/goods/delete` | DELETE | 是+写权限 | 物理删除选品（按 id） |

**商品管理说明（2026-10-01 新增）**：`adp_goods` 为 C 端首页 Tab=3 的数据源，后台增删改**实时生效**（前端页面有提示条说明）。写接口经 `middleware/adminAuth.adminWriteAuth` 拦截 `role='readonly'` 的账号（403），这是后台首个写操作模块，角色权限开始生效。商品图暂采用复制 URL 粘贴方式（无本地上传）。 |

**鉴权设计**：`middleware/adminAuth.js` 校验 `Authorization: Bearer <token>`，失败统一返回 401 JSON；数据表 `adp_admin_user`（username 唯一、bcrypt 密码哈希、role：admin/operator/readonly、status 启停）。管理员表 DDL 与种子账号（admin/admin123）见 `sql/admin.sql`。

**统一响应结构**（后台模块率先落地，后续可推广至 C 端，关联 B-10）：`{ code: 0, msg: 'ok', data: ... }`；错误 `{ code: 非0, msg, data: null }`。后台控制器自行捕获错误返回结构化 JSON，不依赖原有全局错误处理。

**前端页面**（`admin-web/`）：登录页、订单管理（筛选表单 + 表格分页 + 详情抽屉 + **手动同步弹窗（2026-11-16 新增）**：平台二选一/日期区间选择器（30 天跨度限制）/进度条轮询（2s）/完成统计提示/关闭弹窗后台继续运行）、用户管理（筛选 + 表格 + 详情抽屉：汇总卡片/平台分布/最近 10 单）、商品管理（筛选 + 表格 + 新增/编辑弹窗 + 删除二次确认；readonly 角色隐藏写入口）（商品管理为 2026-10-01 新增）。路由守卫校验 `admin_token`，axios 拦截器统一处理 401 跳登录。

**手动同步实现说明（2026-11-16 新增）**：任务管理器 `services/admin/orderSyncTaskService.js`（内存态，进程重启任务丢失、重发即可，幂等无害）；复用 job 脚本 `pullOrdersByDateRange(startDate, endDate, onProgress)`——按平台 API 1 小时窗口约束逐小时分段「拉一段入一段库」并回调进度，30 天区间 ≈ 720 个小时段（约 10~20 分钟）；任务跑在 API 进程内，与常驻 worker（5 分钟增量）并发写安全（order_sn upsert）。耗时提示：UI 已标注跨天任务耗时较长，建议关闭弹窗后台运行。

**部署方式（2026-09-30 起）**：Express 直接托管前端——`app.js` 中 `express.static(admin-web/dist)` + `/admin` SPA 回退，构建产物上传至服务器 `admin-web/dist` 即可，访问 `http://域名/admin`；线上经宝塔 Node项目运行，域名由宝塔自动反代到 3000 端口。开发：后端 `node server.js`，前端 `cd admin-web && npm run dev`（5173 端口，代理到 3000，访问 `http://localhost:5173/admin/`）。

### 3.13 客户端 · 值物微信小程序（clients/wechat-miniprogram/，2026-11-15 并入）

**需求描述**：C 端用户入口，原生微信小程序（无 npm 构建），提供商品搜索/详情、多平台转链（vip/pdd/meituan）、订单收益查询、第三方平台授权等能力。原为独立仓库 `tonystark0416/huigenghao-xcx`，2026-11-15 以 subtree 方式并入本仓库 `clients/wechat-miniprogram/`（保留全部提交历史，可通过 `git log --follow` / `git blame -C` 追溯旧提交）。

**关键约定**：

1. 接口 Host 唯一入口：`clients/wechat-miniprogram/utils/config.js` 的 `BASE_URL`（DEVELOP=`http://localhost:3000`，TRIAL/RELEASE=`https://hgh.pangpai-car.com`），改环境只动这一处；
2. 接口调用统一走 `clients/wechat-miniprogram/utils/api.js`，后端改接口时同步检查该文件调用方；
3. 详细需求与小程序端 Change Log 见 `clients/wechat-miniprogram/REQUIREMENTS.md`（v0.14.6 @ 2026-10-05），小程序迭代需同步更新该文档与本文档 Change Log；
4. 微信开发者工具打开 `clients/wechat-miniprogram/` 目录即可开发，需将目录加入小程序后台的合法域名/项目配置（域名与原仓库一致，无需变更）；
5. console 打印接口信息的固定格式：先一行纯文本说明，下一行单独打印数据对象（不合并、不用 JSON.stringify），保证 console 可折叠查看。

**响应格式 v2（2026-11-15 起，随 v1.9 后端整治同步上线）**：C 端全部接口统一为 `{ code: 200, msg: 'ok', data: ... }`；HTTP 错误 4xx/5xx + `{ code, msg, data: null }`；业务码 -1（平台未授权，`data.needAuthPlatform`）/ -2（不支持的平台）HTTP 200 下发。**版本协商**：小程序 `utils/api.js` 所有请求携带请求头 `X-Client-Ver: 2` 才获得新格式；未携带的历史版本小程序自动回落 legacy 旧结构（线上旧版不受影响），旧版全部淘汰后可移除后端各 controller 的 legacy 分支（`utils/response.js`）。小程序 api.js 作为适配层把 v2 响应解包后**保持页面层契约不变**，页面无需改动。iOS / Android App 未来直接消费 v2 格式。

**后续规划**：~~iOS / Android 原生 App 分别落在 `clients/ios/`、`clients/android/`（预留）~~ 已于 2026-11-20 改为 **uni-app 跨端方案**（见 3.14），占位目录已删除。

---

### 3.14 客户端 · 值物APP（clients/uni-app/，2026-11-20 启动）

**需求描述**：iOS/Android 双端 App，uni-app（Vue3 + Vite CLI 模式）跨端方案——一份代码编译原生 App（非 WebView 套壳），界面与能力对齐小程序端：手机号验证码登录、首页三分段商品流（唯品会/美团/拼多多）、链接转链、今日最优惠活动、吃喝玩乐、订单查询、搜索、商品详情与转链购买（系统浏览器打开）。

**关键约定**：

1. 目录 `clients/uni-app/`（Vite CLI 模式，`npm run build:app` 产出 `dist/build/app`；开发期 HBuilderX 导入项目根目录运行到模拟器/真机）；
2. 接口 Host 唯一入口：`src/utils/config.js` 的 `BASE_URL`（同小程序一致指向正式服务器）；API 层统一 `src/utils/api.js`（uni.request 版，携带 `X-Client-Ver: 2` 消费 v2 响应），顶部 `API_DEBUG` 开关控制请求日志（URL/耗时/状态/响应摘要，打印到 HBuilderX 控制台）；
3. 登录态：`src/utils/auth.js`——uid/token 本地持久化（uni storage），`ensureLogin()` 统一登录闸门；App 登录不带 openid，同手机号与小程序天然同账号；
4. 转链成功后 `plus.runtime.openURL` 系统浏览器打开（App 端无小程序授权跳转流程，美团/vip 坑位直接取可跳转链接）；
5. 设计系统：`src/styles/design.scss` + `src/uni.scss`——小程序 iOS 设计令牌全量平移（分组底/白卡圆角/iOS 分段控件/系统蓝）；
6. 页面清单（`src/pages.json`）：登录、首页、吃喝玩乐、我的订单、搜索、唯品商品详情、美团团购详情 + 三 tab 底栏。

**联调/上架前置项**：

- 联调期验证码：`loginByCode` 接受固定验证码 `000000`（见 3.12，SMS 接入后移除）；
- 短信服务商：暂定腾讯云 SMS（个人认证可发验证码、100 条免费额度；签名「值物APP」+ 验证码模板审核中）；
- iOS 真机/上架：待 Apple Developer 账号（$99/年）→ 云打包/证书签名 → TestFlight；软著、App 备案同步申请；
- 开发机环境：iOS 模拟器需 universal 架构运行时（HBuilderX 标准基座为 x86_64；iOS 27.2 arm64-only 不兼容，用 iOS 18.2 Simulator Runtime）；开发机已卸载会拦截 `launchd_sim` 的 Datacloak（天融信 DACS）。

---

## 4. 平台接入现状

| 平台 | 适配文件 | 已实现能力 | 接入路由状态 |
|---|---|---|---|
| 唯品会 vip | `services/platforms/vipService.js` | 商品列表/搜索/详情/转链(URL与商品ID)/礼品券/订单列表/授权(生成、检查、解绑)/链接校验 vipLinkCheck | ✅ 已接入（vipLinkCheck 未挂路由） |
| 拼多多 pdd | `services/platforms/pddService.js` | 搜索/详情/转链 urlGen/按商品ID生成推广链接 getPddGenUrlByGoods/授权(生成、检查) | ✅ 已接入（按 URL 转链分支被注释，按商品 ID 转链已启用） |
| 美团 meituan | `services/platforms/meituanService.js` | 商品列表（含 vpSkuViewIds 筛选）/单品详情 goodsDetail/推广链接/订单查询 | ✅ 已接入 |
| 微信 weixin | `services/platforms/weixinService.js` | access_token / openid / 手机号 | ✅ 已接入 |
| 淘宝 taobao | `services/platforms/taobaoService.js` | 活动信息/宝贝转链/优选推广/物料推荐 | ❌ **未接入任何路由**（服务已写好，最近一次提交新增） |
| 京东 jd | `services/platforms/jdService.js` | genUrl 转链 | ❌ **未接入任何路由** |

---

## 5. 数据库设计

### 5.1 数据库归属（2026-11-15 分库）

本项目数据库为 **`cps`**（远程 MySQL 42.194.245.3），与庞派租车（`pp_*` 表，仍在 `mike` 库）**分库隔离管理**。`mike` 库中的 `adp_*` 同名表已于 2026-11-15 停止写入，仅作迁移前备份保留。本地与服务器 `.env` 的 `DB_NAME=cps`。

**正式 DDL**：`sql/cps-schema.sql`（2026-11-15 由线上库 `SHOW CREATE TABLE` 原样导出，含索引/自增/字符集，新环境建库以此为准）。

### 5.2 实际使用表（6 张，均在 cps 库）

- `adp_user`：用户表（phone/password/openid），当前 63 行
- `adp_user_auth`：第三方授权绑定遗留表（user_id/biz_code/app_id/openid/unionid），**当前代码无引用**，为历史数据保留（62 行），确认不再需要时可清理
- `adp_order`：CPS 订单（order_sn/uid/goods/status/platform/order_amount/commission），55 行
- `adp_banner`：Banner/运营位（type: 1=首页 2=运营位，sort，extra_id/extra_url），5 行
- `adp_goods`：运营选品（2026-09-20 新增使用，首页 Tab=3 数据源），3 行
- `adp_admin_user`（2026-09-30 新增，DDL 见 `sql/admin.sql`）：管理员（username 唯一/bcrypt 密码/role/status），1 行

> 注：`adp_order` 的查询索引（uid/platform/create_time/order_sn）已在 `sql/admin.sql` 中以注释形式提供，尚未在库上执行（后台多条件查询量大时建议启用）。
>
> 历史说明：旧 `sql/init.sql`（users/verification_codes 表）与代码实际不符，已于 2026-11-15 删除，由 `cps-schema.sql` 取代（原问题 P1-1 / B-6 关闭）。

---

## 6. 环境变量清单（.env）

| 变量 | 用途 |
|---|---|
| `PORT` / `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | 服务与 MySQL（**`DB_NAME=cps`，2026-11-15 起本项目独立库**，与庞派租车的 `mike` 库分库隔离；本地与服务器 .env 均需为 cps） |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | **C 端用户 JWT 密钥/有效期**（2026-11-15 起必填，缺失启动即报错，fail-fast；**服务器 .env 需配置后再部署**。注：旧值曾泄漏于 git 历史，已按 B-5 轮换，本文档不再记录实际值） |
| `SMS_PROVIDER` / `SMS_ACCESS_KEY` / `SMS_ACCESS_SECRET` / `SMS_SIGN_NAME` / `SMS_TEMPLATE_CODE` | **短信服务（可选，App 验证码登录预留）**：未配置 provider 时验证码仅打日志并透出 devCode 供联调，生产接入前必须配置 |
| `VIP_CPS_APPKEY` / `VIP_CPS_APPSECRET` | 唯品会联盟 |
| `JD_CPS_APPKEY` / `JD_CPS_APPSECRET` | 京东联盟 |
| `PDD_CPS_CLIENT_ID` / `PDD_CPS_APPSECRET` | 拼多多 |
| `MT_CPS_APPKEY` / `MT_CPS_APPSECRET` | 美团 |
| `TB_CPS_APPKEY` / `TB_CPS_APPSECRET` | 淘宝联盟 |
| `WECHAT_APPID` / `WECHAT_APPSECRET` | 微信小程序 |
| `ADMIN_JWT_SECRET` | 后台管理 JWT 密钥（与 C 端隔离，2026-09-30 新增，已写入 .env） |
| `PDD_PID` / `VIP_CHAN_TAG` / `VIP_JX_CODE` / `VIP_MINI_SOURCE_ID` / `VIP_MINI_APP_ID` | CPS 业务标识（2026-11-15 新增，可选；缺省回落到 `config/config.js` 的当前线上值。此前散落硬编码在 adpTranUrlService/adpThirdAuthService/pddService/adpIndexListService，现集中收敛到 config） |

---

## 7. 问题清单（技术债，待确认后处理）

> 按用户惯例：优化代码前需先输出问题清单供确认，不擅自改动。

| 编号 | 级别 | 问题 | 位置 |
|---|---|---|---|
| P1-1 | 高 | ~~`sql/init.sql` 表名与代码实际使用的表不一致，业务表缺正式 DDL~~（**2026-11-15 已关闭（v1.10）**：随分库迁移，正式 DDL 以线上库原样导出为 `sql/cps-schema.sql`，过时的 init.sql 已删除） | ~~`sql/init.sql`~~（已删）、`sql/cps-schema.sql` |
| P1-2 | 高 | ~~**敏感信息硬编码**：DeepSeek API Key 明文写死；JWT 密钥、DB 密码有默认明文兜底~~（**2026-11-15 已修复（v1.9）**：AI 聊天模块整体移除；C 端 `JWT_SECRET` 必填走 .env（config 加载期 fail-fast，与 ADMIN_JWT_SECRET 同标准）；DB user/password/database 取消默认兜底。注：旧密钥值仍在 git 历史中（公开仓库），轮换处置见 B-5，本文档不再记录实际值） | ~~`services/aiService.js`~~（已删）、`services/adpUserService.js`、`config/config.js` |
| P1-3 | 中 | ~~订单同步任务写死补拉日期且以 IIFE 方式运行~~（**2026-11-15 已修复（v1.9）**：两个同步脚本改为 CLI 传参 `node job/xxxSync.js [startDate] [endDate]`，缺省拉取昨天~今天；cron 调度仍未启用，见 B-3） | `job/vipOrderSync.js`、`job/meituanOrderSync.js` |
| P1-4 | 高 | ~~**`adp_user` 表物理缺失 `openid` 列**：models 层 `findByOpenid`/`createUser`/`updateUserInfo` 均使用 openid 字段，但表内从未建过该列（mike 库时代即缺失），openid 登录/绑定全链路恒失败（SQL 报 Unknown column）~~（**2026-11-15 已修复（v1.12）**：cps.adp_user 补 `openid VARCHAR(128) NULL` + 索引 `idx_openid`，`sql/cps-schema.sql` 已同步更新；小程序端 app.js 对 v2 响应 `{code:200}` 的成功判定错误问题一并修复） | `cps.adp_user`（DB）、`sql/cps-schema.sql`、小程序 `app.js` |
| P2-1 | 中 | ~~`adpTranUrlService.tranUrl` 中 pdd 分支调用的 `pddTranUrl` 函数整体被注释，遇到拼多多链接会抛运行时错误~~（2026-10-05 已修复：pdd 按链接转链恢复实现，含 error_response 错误处理） | `services/adpTranUrlService.js` |
| P2-2 | 中 | 所有 API 无 JWT 鉴权中间件，token 签发后未校验；订单/转链等接口可被任意调用 | `app.js` |
| P2-3 | 中 | `updateUserInfo` 将 openid 直接覆盖到已有用户，可能与"openid 一对一绑定"规则冲突（A 用户手机号登录会顶掉原绑定关系） | `models/adpUser.js` / `adpUserService.register` |
| P2-4 | 中 | ~~aiService 工具调用参数写死占位值、模型名需核实~~（**2026-11-15 已随 AI 聊天功能整体下线（v1.9）**：agentRoutes/agentController/aiService 三件套已删除，`openai` 依赖已卸载，需求恢复时从 git 历史找回） | ~~`services/aiService.js`~~（已删） |
| P2-5 | 中 | ~~硬编码业务参数：pdd pid、vip chanTag/source_id/app_id、组货码散落各 service~~（**2026-11-15 已修复（v1.9）**：全部集中收敛到 `config/config.js` 的 `cps` 配置块，支持 `PDD_PID`/`VIP_CHAN_TAG`/`VIP_JX_CODE`/`VIP_MINI_SOURCE_ID`/`VIP_MINI_APP_ID` 环境变量覆盖） | `config/config.js` |
| P3-1 | 低 | ~~大量 console.log 调试输出；无统一响应结构与全局错误 JSON 格式~~（**2026-11-15 大部分已修复（v1.9）**：C 端全部接口统一 `{code,msg,data}`（v2 格式 + X-Client-Ver 版本协商兼容旧版小程序，见 3.13）；全局错误中间件与 404 兜底统一 JSON；models/services 高频调试 log 已清理；`pageSize` 未传 vip/pdd 与 tab 非法返回 undefined 两点仍未处理） | 多处 |
| P3-2 | 低 | ~~`test.js`、`express-generator` 等冗余依赖需清理~~（**2026-11-15 已修复（v1.9）**：test.js（含真实手机号）、models/VerificationCode.js 已删除；express-generator/cors/moment/node-cron/openai 5 个零引用依赖已卸载；仍无 ESLint、无单元测试、无 CI） | 工程化 |
| P3-3 | 低 | `meituanService.getGoodsInfo` 中 `productViewSignList:[productViewSignList]`、`vpSkuViewIds:[vpSkuViewIds]` 在参数未传时会生成 `[null]` 发给美团接口（首页 Tab2 调用即触发）；建议改为 `xxx ? [xxx] : []` 兜底（console.log 已于 2026-10-02 关闭） | `services/platforms/meituanService.js`（2026-10-01 新增） |
| P2-6 | 中 | ~~前端 401 跳转硬编码 `location.href='/login'`，部署在 `/admin/` 子路径下 token 过期后会 404~~（2026-10-03 已修复：改为 `import.meta.env.BASE_URL + 'login'` 拼接） | `admin-web/src/api/request.js` |
| P3-4 | 低 | ~~前端三处健壮性问题：`admin_info` 仅登录时写入缓存（后台改角色后前端 readonly 判断失真）、`JSON.parse(localStorage)` 无兜底可能白屏、`getProfile` 接口未被调用~~（2026-10-03 已修复：AdminLayout 挂载时调用 getProfile 刷新缓存、JSON.parse 加 try/catch） | `admin-web/src/layout/AdminLayout.vue`、`admin-web/src/views/goods/GoodsList.vue` |
| P3-5 | 低 | ~~`ADMIN_JWT_SECRET` 未配置时静默降级为开发兜底密钥~~（2026-10-03 已修复：缺失时启动即抛错，需在 .env 配置后才能启动服务）；~~美团 controller 残留 console.log~~（已删除） | `middleware/adminAuth.js`、`controllers/life/adpMeituanController.js` |

---

## 8. Backlog（待排期）

| 编号 | 事项 | 优先级 | 状态 |
|---|---|---|---|
| B-1 | 淘宝 CPS 服务接入路由（转链/详情/物料推荐），补齐 `tb_cps_key` 环境变量 | 高 | 待排期 |
| B-2 | 京东 CPS 服务接入路由 | 中 | 待排期 |
| B-3 | 订单同步任务统一调度：~~支持 CLI 参数传日期补拉~~ + ~~恢复 cron 定时~~ + 增加平台参数（vip/meituan/jd/tb） | 高 | 🔄 大部分完成（2026-11-15 v1.9 CLI 传参上线；2026-11-15 v1.13 PM2 cron_restart 上线；**2026-11-16 v1.14 升级为 5 分钟增量**：常驻 worker `cps-sync-worker` 每轮拉最近 2 小时（按更新时间维度，两平台 API 1 小时窗口约束下自动按小时分段）+ 每天 03:00 全量兜底；VIP 拉单取消 status 写死、全状态拉取；剩余：淘宝/京东平台接入后按同模式扩展） |
| B-4 | JWT 鉴权中间件接入受保护接口（订单、转链等） | 高 | 待排期 |
| B-5 | 敏感信息治理：API Key/JWT Secret 全部迁入 .env，轮换已泄漏密钥 | 高 | ✅ 已完成（2026-11-15：AI 模块已删、`JWT_SECRET` 与 DB 配置强制走 .env（fail-fast）、CPS 业务标识集中收敛 config；历史泄漏密钥已全部处置——DeepSeek key 已在平台作废、DB 密码与 JWT_SECRET 已轮换、仓库已转私有；文档中明文密钥值已清除。可选后续：BFG 清洗 git 历史） |
| B-6 | ~~sql/init.sql 补全正式 DDL 并与代码对齐~~ | 高 | ✅ 已完成（2026-11-15：随分库迁移，正式 DDL 导出为 `sql/cps-schema.sql`（线上库原样导出，6 张表），过时的 init.sql 已删除） |
| B-7 | ~~AI 导购：接入真实 uid/pid 上下文、扩展 pdd/taobao 搜索工具、会话持久化~~ | 中 | ❌ 已下线（2026-11-15 v1.9：AI 聊天三件套整体移除，openai 依赖卸载；需求重启时从 git 历史找回） |
| B-8 | 转链服务恢复并完善 pdd 分支，增加淘宝链接识别 | 中 | 🔄 进行中（pdd"按商品 ID"与"按 URL"转链均已恢复，双平台授权预检已上线（2026-10-05）；仅剩淘宝链接识别未做） |
| B-9 | 验证码登录流程（~~表已建~~ verification_codes 已删，重启需求时需重建） | 低 | 待排期 |
| B-10 | 工程化：~~统一响应格式~~、日志库替换 console.log、ESLint、单测 | 低 | 🔄 部分完成（2026-11-15 v1.9：C 端统一响应 `{code,msg,data}` 已落地（v2 格式 + X-Client-Ver 版本协商，见 3.13），admin 模块此前已落地；剩余：日志库、ESLint、单测） |
| B-11 | 后台管理系统：登录鉴权 + 订单/用户查询（/api/admin + admin-web 前端） | 高 | ✅ 已完成（2026-09-30，见 3.12；后续可扩展：Dashboard 统计、Banner/选品管理、管理员账号管理） |

---

## 9. Change Log（变更记录）

| 日期 | 版本 | 变更内容 | 关联提交 |
|---|---|---|---|
| 2026-11-24 | v1.18 | **小程序 + App 新增「个人中心」底部 tab**。① 两端 tabBar 第 4 项「个人中心」（PIL 生成 81×81 灰/蓝人形图标，两端共用同一设计）；② 页面内容：用户信息卡（头像占位取手机号后两位/昵称默认「用户+后四位」/手机号打码 138\*\*\*\*0000）、账号信息卡（用户 ID/注册手机号）、菜单卡（我的订单跳转/佣金提现占位「敬请期待」）、退出登录（App 清 app_auth storage；小程序清 token/userId/userInfo + 重置 globalData，二次确认弹窗）；③ 未登录态引导：App 跳登录页、小程序提示回首页走登录弹窗流程；④ 小程序全局 custom 导航，my 页面动态取 statusBarHeight 让位状态栏；⑤ App 端构建验证通过 | 待提交 | **App 端 UI 对齐小程序 + 联调期验证码**。① 首页完整重写：补链接转链区（textarea+粘贴+tranUrl 转链+结果卡）、今日最优惠活动坑位（indexBannerList，≥2 条显示；美团坑转链/唯品坑直开）、瀑布流（column-count 双列 + widthFix 原比例图）、「券后」价格行；API 层新增 getIndexActivityBanners/convertLink + API_DEBUG 请求日志开关（HBuilderX 控制台打印 URL/耗时/状态/响应摘要）；② 订单页重构为三段式卡片（头单号+状态色点/体商品信息+平台 tag/尾实付+佣金胶囊），触底自动加载替代按钮；③ 美团详情页重写：全宽 750rpx 大图、价格卡内返利行（¥+比例 tag）、独立门店卡（logo+距离+可用门店数）、购买须知卡；④ 唯品详情页重写：轮播（指示点+自动播放）、priceDesc 按「-」拆段红底高亮、品牌/店铺/分类/销量元信息卡、蓝底标签 chips、通栏详情图；**修复 pid 写死 '123213' → 改用详情接口真实 goods.pid**（影响佣金归属）；⑤ 产品名纠正：App 端「鹏派优选」→「值物APP」（manifest/pages.json/登录页，以小程序品牌为准）；⑥ 清理：删除 clients/ios、clients/android 占位 README，uni-app dist/unpackage 构建产物移出 git；⑦ **后端联调期固定验证码 000000**（loginByCode 跳过校验，可注册可登录；SMS 接入后移除，见 3.12 验证码通道）；⑧ 环境梳理：确认开发机 Datacloak（天融信 DACS）拦截 launchd_sim——卸载后 iOS 模拟器正常；iOS 27.2 运行时 arm64-only 与 HBuilderX x86_64 基座不兼容，已导入 iOS 18.2 universal 运行时解决；短信服务商选型暂定腾讯云 SMS（个人认证 100 条免费，签名/模板审核中） | 待提交 |
| 2026-11-20 | v1.16 | **iOS/Android App 端启动（uni-app 跨端方案）**。① 技术选型：跨端 uni-app（Vue3）而非 iOS 原生——单人开发、界面同步小程序、迟早双端；非 WebView 套壳（原生渲染，规避 App Store 4.3 风险）；② 新增 `clients/uni-app/` 独立工程（Vite CLI 模式，依赖版本已锁定）：设计系统从小程序 app.wxss 平移（iOS 令牌/分段控件/卡片）、API 层移植（uni.request + 登录态 uid/token 本地持久化）；③ 7 页移植完成：登录（手机号+验证码主通道，复用 v1.12 建好的 sendVerificationCode/loginByCode，未接 SMS 时 devCode 自动填入方便联调）、首页（唯品好货/美团热销/多多好货三分段，字段映射与小程序一致）、吃喝玩乐（banner+美团团购列表分页）、我的订单（平台分段+状态文案）、搜索、唯品商品详情（轮播/详情图/底部购买栏→genUrlByGoodsId 转链→系统浏览器打开）、美团团购详情（referralLinkMap 优先取 http 链接）；④ app-plus 目标构建通过（`npm run build:app` → dist/build/app，HBuilderX 导入后可运行 iOS 模拟器/Android 真机体验）；⑤ App 登录不带 openid（后端 loginByCode 已兼容），同手机号小程序/App 天然同账号；⑥ 待办：周末申请 Apple Developer/软著/App 备案后走 TestFlight 上架 | 待提交 |
| 2026-11-16 | v1.15 | **后台订单管理：手动同步订单功能**。① 新增 `POST /api/admin/order/sync`（platform: vip/meituan 二选一，日期区间最长 30 天、不允许未来日期，异步任务立即返回 taskId，同平台互斥 400、异平台可并行，order_sn upsert 幂等）与 `GET /api/admin/order/sync/status`（单任务进度 / 最近任务列表）；② 任务管理器 `services/admin/orderSyncTaskService.js`（内存态，进程重启任务丢失可重发，幂等无害）；③ job 两脚本 `pullOrdersByDateRange` 重构：支持 onProgress 进度回调、逐小时分段「拉一段入一段库」，顺带修复美团 job 新旧 `pullOrdersByDateRange` 重名冲突（旧版引用已删函数导致同步必失败，E2E 抓出）；④ 订单管理页新增手动同步弹窗：平台单选/日期选择器（30 天跨度动态禁用 + 不允许未来日期）/进度条 2s 轮询/完成统计（拉取/新增/更新/出错/耗时）/可关弹窗后台继续运行，完成后自动刷新列表；admin-web 构建验证通过；⑤ E2E 实测全过：参数校验 400×3、发起 running、同平台互斥 400、异平台并行、进度 24/24 → success、任务列表 | 待提交 |
| 2026-11-16 | v1.14 | **订单同步升级：5 分钟增量 + 常驻 worker + 全状态拉取**。① 架构调整：v1.13 嘅「一次性进程 + cron_restart（每天两次）」升级为**常驻 worker**（5 分钟频率下常驻更优：无 288 次进程冷启动、防重叠守卫、故障不跨轮累积）——`job/orderSyncWorker.js`（新，PM2 `cps-sync-worker`），ecosystem 两个一次性 sync 进程合并为一个 worker；② **增量窗口**：每轮拉最近 2 小时（`SYNC_RECENT_HOURS`/`SYNC_INTERVAL_MINUTES` 可调），VIP 按 `updateTimeStart/End`、美团按 `queryTimeType: 2`（**更新时间维度**，新单与老订单状态变化都覆盖；两平台 API 单次查询限 1 小时，逐小时分段合规），每日约 1,900 请求/平台；③ **每日 03:00 兜底**：worker 每天全量补拉昨天~今天一次（内部逐小时分段，窗口合规），防 API 数据延迟漏单；④ **VIP 拉单取消 status 写死**（原 `status: 0` 仅拉不合格单，为存量问题），不传即全状态（0/1/2）；`vipService.orderList` 支持 UpdateTime 透传、status 未传时字段省略；⑤ job 两脚本新增 `syncRecent()` 导出、CLI 入口 `require.main` 守卫（补拉功能不变）；⑥ 双平台 syncRecent 真 API 实测通过（2h 窗口逐小时分段、0 新单无报错）。**服务器部署：`pm2 delete buy-agent-vip-sync buy-agent-meituan-sync`（如有）→ `pm2 start ecosystem.config.js --only cps-sync-worker` → 建议手动跑一次全量补拉 `node job/vipOrderSync.js` 回补历史全状态订单** | 待提交 |
| 2026-11-15 | v1.13 | **订单同步定时任务上线（PM2）**。① 新增 `ecosystem.config.js`（PM2 配置，入库可复现）：3 个进程——`buy-agent-api`（API 常驻）、`buy-agent-vip-sync`（每天 02:00/14:00）、`buy-agent-meituan-sync`（每天 02:30/14:30，Asia/Shanghai，与唯品会错开）；② 同步任务采用 PM2「一次性进程 + cron_restart」模式：启动 → 拉昨天~今天订单入库 → 自动退出 → 到点再拉起，每天两拉覆盖 CPS 订单状态变化（付款→结算/失效）；③ job 两个脚本补显式 `process.exit(0/1)`（MySQL 连接池阻塞事件循环，一次性模式必须显式退出），本地实测两任务跑完 exit=0；④ 日志落 `logs/pm2/*.log`（带时间戳，logs/ 已 ignore）。**注意：API 若已由宝塔 PM2 管理，用 `--only` 只启动同步任务，勿双开 3000 端口**。补拉历史日期仍用 CLI。B-3 大部分完成 | 待提交 |
| 2026-11-15 | v1.12 | **登录链路修复与验证码通道预留**。① **根因修复 P1-4**：`adp_user` 表物理缺失 `openid` 列（mike 库时代即缺，分库原样带入），openid 登录/绑定恒报 `Unknown column 'openid'`——已补列 `VARCHAR(128)` + `idx_openid` 索引并重新导出 `cps-schema.sql`；② 小程序 `app.js` 成功判定修复：不认 v2 `{code:200}` 导致已绑定用户也被判登录失败（api.js 注释声称已改但实际漏改），现 `code===200`/`result`/`success` 三格式兼容，登录成功显式置 `needPhoneLogin=false`，并修正 catch 分支不再误触发手机号弹窗；③ 5 个页面（index/orders/goods/life/meituan-goods）登录回调成功判定统一 v2 兼容；④ **验证码登录通道（iOS/Android App 预留）**：新增 `POST /api/user/sendVerificationCode`（6 位码、5min 有效、60s 重发冷却、SMS 服务商集成点、未接服务商时透出 devCode 供联调）与 `POST /api/user/loginByCode`（未注册自动注册、携带 openid 自动绑定、验证码一次性防重放、单实例内存存储）；config 新增可选 `SMS_*` 环境变量段；小程序 api 层同步预留 `sendVerificationCode`/`loginByCode`（页面 UI 暂不接入）；⑤ 冒烟 7 项全过：未绑定 400/发码/限频 400/错码 400/注册绑定 200/直登 200/legacy 兼容，测试数据已清理 | 待提交 |
| 2026-11-15 | v1.11 | **[小程序] UI 整体改版为 iOS / Apple HIG 风格**：小程序端 v0.16.0——全局设计系统（设计令牌 + 共享弹窗/加载/返回按钮类）、7 页 wxss 全量重写（分段控件/胶囊按钮/毛玻璃底栏/hairline 分组列表）、tabBar 系统蓝 + 图标统一重新着色（PIL 脚本）、移除橙色渐变 hero；页面结构 wxml 与业务逻辑 js 零改动，纯样式层重构。详细清单见小程序 REQUIREMENTS.md v0.16.0。后端无改动 | 待提交 |
| 2026-11-15 | v1.10 | **数据库隔离：从 `mike` 库迁出至独立 `cps` 库（与庞派租车分库管理）**。① 迁移 6 张表（adp_user 63 行 / adp_user_auth 62 行 / adp_order 55 行 / adp_banner 5 行 / adp_goods 3 行 / adp_admin_user 1 行）至 cps 库，行数逐一校验一致；② 正式 DDL 原样导出为 `sql/cps-schema.sql`（含索引/自增/字符集），**关闭 B-6 / P1-1**；删除与代码不符的过时 `sql/init.sql`；③ 本地 `.env` 切换 `DB_NAME=cps`，**服务器 `.env` 需同步切换后重启**；`mike` 库 `adp_*` 表停止写入仅作备份，`pp_*` 表（庞派租车）不受影响；④ 5.1/5.2 数据库章节重写（分库归属 + 6 张表现状，标注 adp_user_auth 为无引用遗留表）；⑤ 顺手修复密码登录业务错误（未注册/密码错误）误返 500 的问题，统一 400（v2）/ `{success:false,error}`（legacy），双模式冒烟通过 | 待提交 |
| 2026-11-15 | v1.9 | **代码结构整治（全项目，AI 主导维护模式首次全量落地）**。① 安全止血：C 端 `JWT_SECRET` 迁 .env（config 加载期 fail-fast）、DB user/password/name 取消硬编码兜底、CPS 业务标识（pddPid/vipChanTag/vipJxCode/vipMiniSourceId/vipMiniAppId）集中收敛 `config/config.js` 可 env 覆盖；② 删除死代码：AI 聊天三件套（routes/agentRoutes、controllers/agentController、services/aiService，openai 依赖卸载）、test.js（含真实手机号）、models/VerificationCode.js；③ **C 端统一响应 `{code,msg,data}`**：新增 `utils/response.js`，全部 C 端 controller 接入，`X-Client-Ver: 2` 请求头版本协商兼容线上旧版小程序（legacy 分支待旧版淘汰后移除）；全局错误中间件/404/健康检查统一 JSON；④ 新增 `services/adapters/`（vipAdapter/pddAdapter）集中 vip/pdd 字段映射，搜索/详情/转链三处复用；顺手修复 pdd 商品详情 `goods_sign` 参数错传导致 pdd 详情恒失败的隐性 bug；⑤ models 命名统一 `xxxModel`（adpUser→adpUserModel、adpOrder→adpOrderModel，git mv 保历史）；job 脚本改 CLI 传参（`npm run sync:vip` / `sync:meituan [startDate] [endDate]`）；banner service 合并重复函数；清 debug log/隐式全局变量/pdd searchGoods pid 兜底；⑥ package.json 精简（移除 express-generator/cors/moment/node-cron/openai，补 start/sync scripts）；⑦ 预留 `clients/ios/`、`clients/android/`（README 说明未来消费 v2 统一格式）；⑧ 小程序端：`utils/api.js` 全量适配 v2 格式（请求头 + 适配器解包，页面层契约不变），app.js 登录成功判断改 `code === 200`；⑨ 本地冒烟测试通过（legacy/v2 双模式、404、参数校验、DB 路由）；⑩ 新增根目录 `README.md`（结构地图/快速启动/部署/迭代约定，仓库入口文档）；⑪ `project.private.config.json`（微信开发者工具个人配置）移出 git 跟踪并 ignore。**部署提醒：服务器 .env 需补 `JWT_SECRET` 及 CPS 标识变量后再发布** | 待提交 |
| 2026-11-15 | v1.8 | **仓库架构调整：并入值物微信小程序，monorepo 化**。① 原独立仓库 `huigenghao-xcx` 以 subtree 方式并入 `clients/wechat-miniprogram/`，保留全部提交历史；② 目录结构新增 `clients/` 分组（预留 ios/android，见 2.1）；③ 新增 3.13 客户端章节（小程序关键约定：BASE_URL 唯一入口、api.js 调用方联动检查、文档双更新约定）；④ `.gitignore` 忽略 `.codebuddy/`；⑤ 小程序端详细需求仍维护于 `clients/wechat-miniprogram/REQUIREMENTS.md`（v0.14.6），迭代时与本文档双更新；⑥ 迁移前小程序端已收尾提交（pdd appId 登记、首页坑位适配，v0.14.7 前置改动） | `0268a08`（merge）、`1a400f5`（小程序收尾） |
| 2026-10-05 | v1.7 | ① 3.5 `/api/tranUrl` 恢复 pdd 按链接转链（解决 P2-1），pdd 转链前同样增加授权预检；② 响应码统一 `200/-1/-2`；③ 必传参数改为 `uid + source_url`；④ P2-5 补充按链接转链的默认 pid/chanTag；⑤ B-8 状态更新（仅剩淘宝识别） | `f142245` |
| 2026-10-03 | v1.6 | ① 3.2 新增解绑授权接口 `GET /api/thirdAuth/unbind`（仅 vip，调 unbindOpenId）；② 3.5 `/api/tranUrl` vip.com 链接转链前增加授权预检，未授权返回 `needAuthPlatform: 'vip'` 供前端引导授权 | `ba28b81` |
| 2026-10-03 | v1.5 | 一致性审查（代码 `cb07b10`）+ 修复落地：① 3.9 vip 补拉区间更正为 `2026-09-26 ~ 2026-09-30`（此前文档漏同步 `2aecaf8`）；② 修复 P2-6 前端 401 跳转子路径 404（BASE_URL 拼接）；③ 修复 P3-4（AdminLayout 挂载时 getProfile 刷新 admin_info 缓存、JSON.parse 兜底）；④ 修复 P3-5（ADMIN_JWT_SECRET 缺失启动即报错、删除美团 controller 残留 console.log）。注意：`ADMIN_JWT_SECRET` fail-fast 后，未配置 .env 的环境将无法启动服务 | `1f1bc4d` |
| 2026-10-01 | v1.4.1 | 美团模块接口变更同步文档：① 3.10 `/api/meituan/goods` 标注完整参数透传（含 vpSkuViewIds），新增 `/api/meituan/goodsDetail` 单品接口；② 4 平台现状更新美团能力清单；③ 3.11 标注 `/chat` 路由已注释下线；④ 3.12 部署方式更新为 Express 托管 `/admin` + 宝塔 Node项目方案；⑤ 新增问题 P3-3（meituanService `[null]` 兜底缺失与 console.log 打开） | `aea4466`（美团接口）、`44b1298`（/chat 下线）、`6eb069f`（/admin 托管） |
| 2026-10-01 | v1.4 | 后台新增商品管理（adp_goods 运营选品 CRUD）：① 4 个接口 `goods/list/create/update/delete`，字段校验（platform 白名单、goods_platform_id 必填、价格非负、URL 格式）；② 首个写操作模块，`adminWriteAuth` 拦截 readonly 角色（403）；③ 前端商品管理页面（筛选/表格/新增编辑弹窗/删除二次确认，提示数据实时同步 C 端首页 Tab3）；④ 物理删除、不加排序列、商品图为 URL 粘贴（经用户确认）；⑤ `adpGoodsModel`（C 端）与表结构均未改动 | — |
| 2026-09-30 | v1.3 | 新增后台管理模块（3.12）：① 后端 `/api/admin` 路由组（登录/鉴权/订单/用户查询），独立 JWT 密钥 `ADMIN_JWT_SECRET`，统一响应 `{code,msg,data}`，控制器自行结构化错误处理；② 新增 `adp_admin_user` 表与种子账号（`sql/admin.sql`，已在开发库执行）；③ 前端 `admin-web/` 同仓子工程（Vue3 + Vite + Element Plus）：登录页、订单管理、用户管理；④ 目录结构/环境变量/数据库章节同步更新；⑤ `app.js` 仅新增 2 行挂载，未改动既有业务代码；⑥ Backlog 新增 B-11 并标记完成，B-10 标注后台已落地统一响应 | `8b7e0b7`（另 `6eb069f` 为 Express 托管 `/admin` 静态路径的部署改动） |
| 2026-09-29 | v1.2 | 一致性审查后修订：① 3.1 业务规则澄清 `register` 与 `loginByOpenid` 的 openid 行为差异，关联空值清空风险；② 4 平台接入现状 vip `vipLinkCheck` 标注未挂路由；③ 5.2 精简 adp_user 字段、补齐四张业务表均缺 DDL 说明；④ 3.6 Tab=3 标注不支持分页/位置参数；⑤ 3.9 同步任务补 meituan 同日期区间与时间戳；⑥ 目录结构 routes 补 life/；⑦ P1-1 范围更新 | — |
| 2026-09-20 | v1.1 | ① 首页新增 Tab=3 拼多多运营选品列表（`adp_goods` 表，新增 `models/adpGoodsModel.js`）；② `/api/tranUrl/genUrlByGoodsId` 新增拼多多支持（`pdd.ddk.goods.promotion.url.generate`），出参增加 `weapp_source_id`/`weapp_app_id`；③ 清除 aiService 中硬编码的 DeepSeek API Key（功能待接 .env 恢复）；④ 新增问题 P2-5（pdd pid、vip 小程序参数硬编码），更新 P1-2、B-8 状态 | `a70cee3, faf32bd, 44074e5` |
| 2026-09-18 | v1.0 | 初次全量梳理项目并建立需求文档：模块清单、API 清单、平台接入现状、问题清单（P1-1 ~ P3-2）、Backlog（B-1 ~ B-10） | — |

### 历史 Git 提交摘要（供追溯）
- `448b791` feat: add taobao cps services（淘宝服务已写、未挂路由）
- `79990bf` fix: update index platform parameters
- `3747b14` chore: update order sync ranges
- `23f6aed` feat: add index banner and link options
- `9820be9` fix: update user registration flow
- `3615398` feat: add unified index list endpoint
- `a1ee9d0` fix: format order dates and filter by platform
- `d4e6aac` fix: unify order timestamps and sync updates
- `4f8d9f3` feat: add goods id promotion url endpoint
- `a2a184d` feat: add unified goods detail service
