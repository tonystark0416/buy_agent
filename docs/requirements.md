# buy_agent 项目需求文档

> 本文档是 buy_agent 项目唯一的需求与迭代追踪文档。每次迭代必须同步更新本文档正文与 Change Log，否则视为迭代未完成。

- 文档版本：v1.1
- 更新日期：2026-09-20
- 维护人：liuweizhao（AI 辅助迭代）
- 仓库：https://github.com/tonystark0416/buy_agent.git（本地路径 `/Users/liuweizhao/Desktop/buy_agent`，分支 `main`）

---

## 1. 项目概述

buy_agent 是一个**多平台 CPS（按成交计费）导购返佣聚合后端服务**，为前端小程序/H5 提供：

1. 聚合多个电商平台（唯品会、拼多多、淘宝、京东）与本地生活平台（美团）的商品搜索、商品详情、推广转链能力；
2. 用户体系（微信 openid + 手机号）与 JWT 登录态；
3. CPS 佣金订单的拉取、入库与查询（用户收益明细）；
4. AI 导购对话（DeepSeek 大模型 + 工具调用，实现"聊天即搜品"）；
5. 运营位能力（首页 Banner、礼品券）。

**目标用户**：通过微信小程序使用导购服务的 C 端用户；管理 Banner/选品的运营人员。

**当前状态**：核心链路（登录、搜索、详情、转链、订单）已上线可用；淘宝、京东平台服务已实现但尚未接入路由；AI 聊天功能为原型状态。

---

## 2. 技术架构

| 项 | 说明 |
|---|---|
| 运行时 | Node.js + Express 5（`app.js` 装配中间件与路由，`server.js` 启动监听，默认端口 `PORT` 或 3000） |
| 数据库 | MySQL（`mysql2/promise` 连接池，`utils/database.js`，`dateStrings: true`） |
| 认证 | JWT（`jsonwebtoken`，1h 过期）+ 密码哈希（`bcryptjs`） |
| 定时任务 | `node-cron`（当前订单同步脚本以手动一次性方式运行） |
| AI | OpenAI SDK 兼容接口 → DeepSeek（流式 + Function Calling） |
| 配置 | `config/config.js` 读取 `.env`（dotenv），含各平台 CPS 密钥、微信、数据库配置 |
| 分层 | `routes → controllers → services → models / services/platforms（各平台 API 适配层）` |

### 目录结构

```
├── app.js                 # 应用装配（路由注册、JSON 解析、错误处理）
├── server.js              # HTTP 启动入口
├── config/config.js       # 环境变量配置（DB / 各平台 CPS 密钥 / 微信）
├── routes/                # 路由层（12 个模块，life/ 为本地生活类）
├── controllers/           # 控制器层（参数解析、调 service、返回）
│   └── life/              # 美团等本地生活业务
├── services/              # 业务服务层（聚合、格式化、统一出参）
│   └── platforms/         # 平台适配层：vip / pdd / taobao / jd / meituan / weixin
├── models/                # 数据访问层：adp_user / adp_order / adp_banner / adp_goods / verification_codes
├── job/                   # 订单同步任务：vipOrderSync / meituanOrderSync
├── utils/                 # database 连接池 / meituan 签名 / 时间工具
├── sql/init.sql           # 建表脚本
└── test.js                # 临时测试脚本
```

---

## 3. 功能模块与需求详述

### 3.1 用户与认证模块（/api/user、/api/weixin）

**需求描述**：支持微信小程序用户以最小摩擦方式注册/登录，获得 JWT 供后续接口使用。

| API | 方法 | 说明 |
|---|---|---|
| `/api/user/register` | POST | 注册/登录一体：手机号已存在则直接登录并回填 openid；支持"手机号+密码"、"手机号+openid"、"纯手机号"三种注册方式；密码最少 6 位 |
| `/api/user/login` | POST | 手机号 + 密码登录（bcrypt 校验） |
| `/api/user/loginByOpenid` | POST | openid 登录（openid 未绑定账号时报错） |
| `/api/weixin/openid` | GET | 通过 wx.login code 换取 openid |
| `/api/weixin/getPhone` | GET | 通过 code 获取用户微信手机号 |

**业务规则**：
- 手机号唯一（`uk_phone`）；openid 与用户一对一绑定，重复绑定时报错提示；
- 注册成功即签发 JWT（含 userId、phone，1 小时有效期）；
- 手机号已注册时调用注册接口视为登录，并静默更新 openid。

**数据表**：`adp_user`（id、phone、password、nickname、avatar、openid）、`verification_codes`（验证码，当前未启用短信发送流程）。

### 3.2 第三方授权模块（/api/thirdAuth）

**需求描述**：CPS 返佣要求用户在第三方平台完成推广授权备案，本模块生成授权链接并查询授权状态。

| API | 方法 | 说明 |
|---|---|---|
| `/api/thirdAuth/genAuthUrl` | GET | 生成授权链接（支持 pdd / vip），返回 h5_url、weapp_url、deeplink_url |
| `/api/thirdAuth/checkAuth` | GET | 检查授权状态，返回 `{ isAuth: true/false }` |

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
| `/api/tranUrl` | GET | 按原始 URL 转链：自动识别链接中的 `pinduoduo` / `vip.com` 域名分发（pdd 转链当前被注释禁用，仅 vip 可用）；返回 h5_url、weapp_url、weapp_short_link、deeplink_url |
| `/api/tranUrl/genUrlByGoodsId` | GET | 按商品 ID 转链：支持 vip / pdd；返回 goodsId + urls{ h5_url, weapp_url, weapp_source_id, weapp_app_id, deeplink_url, command }。pdd 走 `pdd.ddk.goods.promotion.url.generate`，vip 走 genByGoodsId |

**注意（2026-09-20）**：按商品 ID 转链的 pdd 分支中 `pid` 写死为 `43384525_317172887`，vip 分支的小程序 `weapp_source_id`（gh_8ed2afad9972）/`weapp_app_id`（wxe9714e742209d35f）写死在代码中，见问题清单 P2-5。

### 3.6 首页列表模块（/api/indexList）

**需求描述**：首页分 Tab 聚合内容流。

| Tab | 内容 | 数据源 |
|---|---|---|
| 1 | 精选商品（唯品会好货频道） | vipService.goodsListV2，jxCode=`dz5d5n7i` |
| 2 | 本地生活到店商品（今日必推） | meituanService.getGoodsInfo（platform=2 到店业务，listTopiId=2，需经纬度） |
| 3 | 拼多多运营选品（2026-09-20 新增） | `adp_goods` 表（models/adpGoodsModel.selectGoodsList，查询 platform='pdd' 的运营入库商品） |

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
- `vipOrderSync.js`：唯品会订单拉取。核心逻辑为"按小时区间分片拉取 + 分页 + 去重 + 存在即更新/不存在即插入"；cron 定时调度代码已写好但**当前被注释**，脚本以一次性日期范围补拉方式运行（当前写死 2026-09-01 ~ 2026-09-12）；
- `meituanOrderSync.js`：美团订单拉取，逻辑同上（订单 uid 取美团侧 sid，时间为秒级时间戳换算北京时间）。

### 3.10 本地生活（美团）模块（/api/meituan）

| API | 方法 | 说明 |
|---|---|---|
| `/api/meituan/goods` | GET | 外卖商品列表 |
| `/api/meituan/referral-link-by-goods-id` | GET | 按商品 ID 获取推广链接 |
| `/api/meituan/referral-link-by-act-id` | GET | 按活动 ID 获取推广链接 |
| `/api/meituan/order-info` | GET | 查询订单信息（亦被同步任务复用） |

签名工具：`utils/meituan-sign-util.js`。

### 3.11 AI 导购对话模块（/chat）

**需求描述**：用户以自然语言表达购物意图，AI 自动调用平台搜索工具并流式返回推荐内容。

- 模型：DeepSeek（OpenAI 兼容协议，`deepseek-v4-pro`，流式输出）；
- 工具：`search_vip_goods`（关键词搜索唯品会商品）；
- 事件回调：`token`（增量文本）、`tool_calls`、`status`（如"正在唯品会搜索..."）、`done`、`error`；
- 当前状态：**原型/演示阶段**——工具调用的 openid/chanTag 写死为占位值，仅接了唯品会一个工具。

---

## 4. 平台接入现状

| 平台 | 适配文件 | 已实现能力 | 接入路由状态 |
|---|---|---|---|
| 唯品会 vip | `services/platforms/vipService.js` | 商品列表/搜索/详情/转链(URL与商品ID)/礼品券/订单列表/授权(生成、检查、解绑)/链接校验 | ✅ 已接入 |
| 拼多多 pdd | `services/platforms/pddService.js` | 搜索/详情/转链 urlGen/按商品ID生成推广链接 getPddGenUrlByGoods/授权(生成、检查) | ✅ 已接入（按 URL 转链分支被注释，按商品 ID 转链已启用） |
| 美团 meituan | `services/platforms/meituanService.js` | 商品列表/推广链接/订单查询 | ✅ 已接入 |
| 微信 weixin | `services/platforms/weixinService.js` | access_token / openid / 手机号 | ✅ 已接入 |
| 淘宝 taobao | `services/platforms/taobaoService.js` | 活动信息/宝贝转链/优选推广/物料推荐 | ❌ **未接入任何路由**（服务已写好，最近一次提交新增） |
| 京东 jd | `services/platforms/jdService.js` | genUrl 转链 | ❌ **未接入任何路由** |

---

## 5. 数据库设计

### 5.1 已建表（sql/init.sql）
- `users`：手机号唯一，密码哈希、昵称、头像（注：init.sql 中的表名/结构与 models 实际使用的 `adp_user`、`adp_order`、`adp_banner` **不一致**，见问题清单 P1-1）。

### 5.2 实际使用表（由 models 推断，缺正式 DDL）
- `adp_user`：id, phone, password, nickname, avatar, openid
- `adp_order`：order_sn, uid, goods_id, goods_name, goods_img_url, status, platform, order_amount, commission, create_time, update_time
- `adp_banner`：type(1=首页 2=运营位), sort 及链接配置字段
- `adp_goods`（2026-09-20 新增使用）：运营选品商品表，含 platform 字段（当前用于 pdd 首页 Tab），缺正式 DDL
- `verification_codes`：phone, code, type(1=登录), expires_at, used

---

## 6. 环境变量清单（.env）

| 变量 | 用途 |
|---|---|
| `PORT` / `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | 服务与 MySQL |
| `VIP_CPS_APPKEY` / `VIP_CPS_APPSECRET` | 唯品会联盟 |
| `JD_CPS_APPKEY` / `JD_CPS_APPSECRET` | 京东联盟 |
| `PDD_CPS_CLIENT_ID` / `PDD_CPS_APPSECRET` | 拼多多 |
| `MT_CPS_APPKEY` / `MT_CPS_APPSECRET` | 美团 |
| `TB_CPS_APPKEY` / `TB_CPS_APPSECRET` | 淘宝联盟 |
| `WECHAT_APPID` / `WECHAT_APPSECRET` | 微信小程序 |

---

## 7. 问题清单（技术债，待确认后处理）

> 按用户惯例：优化代码前需先输出问题清单供确认，不擅自改动。

| 编号 | 级别 | 问题 | 位置 |
|---|---|---|---|
| P1-1 | 高 | `sql/init.sql` 表名（users/verification_codes）与代码实际使用的表（adp_user/adp_order/adp_banner）不一致，且缺 adp_order、adp_banner 的 DDL，新环境无法一键建库 | `sql/init.sql` |
| P1-2 | 高 | **敏感信息硬编码**：~~DeepSeek API Key 明文写死~~（2026-09-20 已从代码清除，但历史提交中仍存在，建议作废该 Key；当前代码中为空字符串，AI 对话功能不可用，需改走 .env 环境变量）；JWT 密钥仍写死（`19910416`）、DB 密码有默认明文兜底 | `services/aiService.js`、`services/adpUserService.js`、`config/config.js` |
| P1-3 | 高 | 订单同步任务写死补拉日期（2026-09-01 ~ 2026-09-12）且以立即执行 IIFE 方式运行，cron 调度被注释；`node server` 时任务不会自动执行，也未纳入统一调度 | `job/vipOrderSync.js`、`job/meituanOrderSync.js` |
| P2-1 | 中 | `adpTranUrlService.tranUrl` 中 pdd 分支调用的 `pddTranUrl` 函数整体被注释，遇到拼多多链接会抛 `pddTranUrl is not defined` 运行时错误 | `services/adpTranUrlService.js` |
| P2-2 | 中 | 所有 API 无 JWT 鉴权中间件，token 签发后未校验；订单/转链等接口可被任意调用 | `app.js` |
| P2-3 | 中 | `updateUserInfo` 将 openid 直接覆盖到已有用户，可能与"openid 一对一绑定"规则冲突（A 用户手机号登录会顶掉原绑定关系） | `models/adpUser.js` / `adpUserService.register` |
| P2-4 | 中 | aiService 工具调用参数 openid/chanTag 写死占位值，未接真实用户上下文；模型名 `deepseek-v4-pro` 与密钥需核实 | `services/aiService.js` |
| P2-5 | 中 | 硬编码业务参数：pdd 按商品 ID 转链的 `pid` 写死为 `43384525_317172887`；vip 转链出参中小程序 `weapp_source_id`/`weapp_app_id` 写死（2026-09-20 新增），应迁入配置 | `services/adpTranUrlService.js` |
| P3-1 | 低 | `pageSize` 定义了但未传入 vip/pdd 请求参数；`adpIndexListService` 无 default 返回值（tab 非法时返回 undefined）；大量 console.log 调试输出；无统一响应结构与全局错误 JSON 格式 | 多处 |
| P3-2 | 低 | `test.js`、`express-generator` 依赖、无意义的 `scripts.test` 需清理；无 ESLint、无单元测试、无 CI | 工程化 |

---

## 8. Backlog（待排期）

| 编号 | 事项 | 优先级 | 状态 |
|---|---|---|---|
| B-1 | 淘宝 CPS 服务接入路由（转链/详情/物料推荐），补齐 `tb_cps_key` 环境变量 | 高 | 待排期 |
| B-2 | 京东 CPS 服务接入路由 | 中 | 待排期 |
| B-3 | 订单同步任务统一调度：恢复 cron 定时 + 支持 CLI 参数传日期补拉 + 增加平台参数（vip/meituan/jd/tb） | 高 | 待排期 |
| B-4 | JWT 鉴权中间件接入受保护接口（订单、转链等） | 高 | 待排期 |
| B-5 | 敏感信息治理：API Key/JWT Secret 全部迁入 .env，轮换已泄漏密钥 | 高 | 待排期 |
| B-6 | sql/init.sql 补全 adp_user / adp_order / adp_banner / verification_codes 正式 DDL 并与代码对齐 | 高 | 待排期 |
| B-7 | AI 导购：接入真实 uid/pid 上下文、扩展 pdd/taobao 搜索工具、会话持久化 | 中 | 待排期 |
| B-8 | 转链服务恢复并完善 pdd 分支，增加淘宝链接识别 | 中 | 🔄 进行中（2026-09-20 已完成"按商品 ID"的 pdd 转链；"按 URL"的 pdd 分支仍被注释，淘宝识别未做） |
| B-9 | 验证码登录流程（表已建，短信通道未接） | 低 | 待排期 |
| B-10 | 工程化：统一响应格式、日志库替换 console.log、ESLint、单测 | 低 | 待排期 |

---

## 9. Change Log（变更记录）

| 日期 | 版本 | 变更内容 | 关联提交 |
|---|---|---|---|
| 2026-09-20 | v1.1 | ① 首页新增 Tab=3 拼多多运营选品列表（`adp_goods` 表，新增 `models/adpGoodsModel.js`）；② `/api/tranUrl/genUrlByGoodsId` 新增拼多多支持（`pdd.ddk.goods.promotion.url.generate`），出参增加 `weapp_source_id`/`weapp_app_id`；③ 清除 aiService 中硬编码的 DeepSeek API Key（功能待接 .env 恢复）；④ 新增问题 P2-5（pdd pid、vip 小程序参数硬编码），更新 P1-2、B-8 状态 | `a70cee3` |
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
