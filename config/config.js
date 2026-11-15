const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: requireEnv('DB_USER'),
        password: requireEnv('DB_PASSWORD'),
        database: requireEnv('DB_NAME'),
    },
    // C 端用户 JWT（2026-11-15 起强制走环境变量，不再允许硬编码，缺省即拒绝启动）
    jwt: {
        secret: requireEnv('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
    vip_cps_key: {
        appKey: process.env.VIP_CPS_APPKEY,
        appSecret: process.env.VIP_CPS_APPSECRET,
    },
    jd_cps_key: {
        appKey: process.env.JD_CPS_APPKEY,
        appSecret: process.env.JD_CPS_APPSECRET,
    },
    pdd_cps_key: {
        client_id: process.env.PDD_CPS_CLIENT_ID,
        appSecret: process.env.PDD_CPS_APPSECRET,
    },
    wechat: {
        appId: process.env.WECHAT_APPID,
        appSecret: process.env.WECHAT_APPSECRET
    },
    meituan_cps_key: {
        appKey: process.env.MT_CPS_APPKEY,
        appSecret: process.env.MT_CPS_APPSECRET,
    },
    taobao_cps_key: {
        appKey: process.env.TB_CPS_APPKEY,
        appSecret: process.env.TB_CPS_APPSECRET,
    },
    // CPS 业务标识（2026-11-15 集中收敛：此前散落在各 service 里硬编码）
    // 支持环境变量覆盖，缺省回落到当前线上生效值，保证未更新 .env 的环境不受影响
    cps: {
        pddPid: process.env.PDD_PID || '43384525_317172887',              // 拼多多推广位 pid
        vipChanTag: process.env.VIP_CHAN_TAG || 'default_chanTag',        // 唯品会推广位 chanTag
        vipJxCode: process.env.VIP_JX_CODE || 'dz5d5n7i',                 // 唯品会组货码（首页 tab=1）
        vipMiniSourceId: process.env.VIP_MINI_SOURCE_ID || 'gh_8ed2afad9972', // 唯品会小程序 source_id（gh_ 前缀）
        vipMiniAppId: process.env.VIP_MINI_APP_ID || 'wxe9714e742209d35f',    // 唯品会小程序 appId
    },
}

/**
 * 必需环境变量读取：缺失即抛错（服务启动期 fail-fast，与 admin 模块 ADMIN_JWT_SECRET 同一标准）
 */
function requireEnv(name) {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`[config] 缺少必需的环境变量 ${name}，请检查 .env 配置`);
    }
    return value;
}

module.exports = config;
