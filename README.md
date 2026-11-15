# buy_agent

多平台 CPS（按成交计费）导购返佣聚合平台 —— 值物微信小程序 + Node.js 后端 + 运营管理后台的 monorepo。

> 详细的业务需求、API 契约、迭代记录见 [`docs/requirements.md`](docs/requirements.md)（项目唯一需求追踪文档）。

## 仓库结构

```
buy_agent/
├── server.js / app.js          # 后端入口（Express 5，根目录即后端）
├── controllers/                # 控制器层：HTTP 入参校验与响应组装
│   ├── *.js                    #   C 端接口（search/goods/tranUrl/user/...）
│   ├── life/                   #   本地生活平台（美团）
│   └── admin/                  #   后台管理接口
├── services/                   # 业务层：平台调用、聚合逻辑
│   ├── platforms/              #   各平台开放接口封装（vip/pdd/meituan/weixin/taobao/jd 预留）
│   ├── adapters/               #   平台响应字段映射（vipAdapter/pddAdapter，供 search/detail/tranUrl 复用）
│   └── admin/                  #   后台业务
├── models/                     # 数据访问层：MySQL（统一 adpXxxModel 命名，全部占位符 SQL）
├── routes/                     # 路由注册（与 controller 一一对应；admin/、life/ 分组）
├── middleware/                 # 鉴权等中间件（adminAuth）
├── config/                     # 配置中心（.env 读取、CPS 业务标识集中收敛，敏感项缺失启动即报错）
├── utils/                      # 跨层工具（database 连接池、统一响应封装 response.js、时间/签名工具）
├── job/                        # 订单同步脚本（CLI 手动执行：npm run sync:vip / sync:meituan）
├── sql/                        # 数据库 DDL 与种子数据
├── docs/                       # 项目文档（requirements.md 为唯一需求与迭代追踪文档）
├── admin-web/                  # 管理后台前端（Vue3 + Vite + Element Plus，独立 package.json）
└── clients/                    # C 端客户端
    ├── wechat-miniprogram/     #   值物微信小程序（原生，详细需求见其内 REQUIREMENTS.md）
    ├── ios/                    #   预留：未来 iOS App（消费 C 端 v2 统一响应格式）
    └── android/                #   预留：未来 Android App（同上）
```

**分层纪律**：routes → controllers → services → models 单向依赖；controllers 不碰 SQL，services 不碰 `res`；平台字段映射一律走 `services/adapters/`。

**统一响应格式（C 端 v2）**：成功 `{ code: 200, msg: 'ok', data }`；HTTP 错误 `4xx/5xx + { code, msg, data: null }`；业务码 -1（平台未授权）/ -2（不支持的平台）HTTP 200 下发。客户端请求头携带 `X-Client-Ver: 2` 获得新格式（旧版自动回落 legacy，见 `utils/response.js`）。

## 快速启动（后端）

```bash
cp 配置 .env            # 见「环境变量」；JWT_SECRET / DB_* 必填，缺失启动即报错
npm install
npm run dev             # nodemon 开发模式，默认 3000 端口
```

常用脚本：

| 命令 | 用途 |
|---|---|
| `npm start` | 生产启动 |
| `npm run sync:vip [startDate] [endDate]` | 拉取唯品会订单入库（缺省昨天~今天） |
| `npm run sync:meituan [startDate] [endDate]` | 拉取美团订单入库 |

### 环境变量（.env）

完整清单见 [`docs/requirements.md` 第 6 节](docs/requirements.md)。关键项：

- `JWT_SECRET` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`：**必填**，缺失启动即抛错（fail-fast）
- `VIP_CPS_APPKEY` 等各平台 CPS 密钥：按需配置
- `PDD_PID` / `VIP_CHAN_TAG` / `VIP_JX_CODE` 等 CPS 业务标识：可选，缺省回落 config 内当前线上值

## 快速启动（admin-web）

```bash
cd admin-web && npm install && npm run dev   # 5173，代理到后端 3000
```

生产构建产物上传服务器 `admin-web/dist/`，由 Express 托管在 `/admin` 路径。

## 微信小程序

微信开发者工具直接打开 `clients/wechat-miniprogram/`；接口域名唯一入口 `utils/config.js` 的 `BASE_URL`。

## 部署

- 后端：宝塔 Node 项目（PM2）跑根目录，域名反代 3000 端口；**发布前确认服务器 .env 已含 `JWT_SECRET`**
- admin-web：构建产物传 `admin-web/dist/`
- 数据库：`sql/` 内 DDL 按需执行

## 迭代约定

1. 需求与迭代记录统一记入 `docs/requirements.md`（正文 + Change Log，版本号递增）；涉及小程序的改动同步更新 `clients/wechat-miniprogram/REQUIREMENTS.md`（双更新）
2. 代码 commit / push 由人工指令触发
