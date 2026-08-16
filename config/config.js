
const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'mike',
        password: process.env.DB_PASSWORD || 'mike@0416',
        database: process.env.DB_NAME || 'mike'
    },
    vip_cps_key: {
        appKey: process.env.VIP_CPS_APPKEY,
        appSecret: process.env.VIP_CPS_APPSECRET,
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
    }
}




module.exports = config;
