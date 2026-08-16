/**
 * 接口签名工具（Node.js 版本）
 * 使用 Node.js 原生 crypto 模块替代 crypto-js，无需额外依赖
 *
 * 签名需要的头部字段
 * S-Ca-App：APP KEY
 * S-Ca-Timestamp：当前时间戳
 * S-Ca-Signature：签名字符串
 * S-Ca-Signature-Headers：参与签名的头部字段
 * Content-MD5：请求参数加密的值
 */
const crypto = require('crypto');

const SignUtil = {
    // APP KEY（请替换为你自己的 AppKey）
    APP_KEY: '',
    // APP密钥（请替换为你自己的 Secret）
    APP_SECRET: '',

    /**
     * 获取签名头部字段
     * @param {*} config
     * @returns 签名头部字段对象
     */
    getSignHeaders(config) {
        const signHeaders = {
            'S-Ca-App': SignUtil.APP_KEY,
            'S-Ca-Timestamp': String(Date.now()),
            'S-Ca-Signature-Headers': 'S-Ca-App,S-Ca-Timestamp',
            'Content-MD5': SignUtil.contentMD5(config),
        };
        signHeaders['S-Ca-Signature'] = SignUtil.sign(config, signHeaders);
        return signHeaders;
    },

    /**
     * 计算签名
     * @param {*} config
     * @param {*} signHeaders
     * @returns 签名字符串
     */
    sign(config, signHeaders) {
        const strSign =
            `${SignUtil.httpMethod(config)}\n` +
            `${SignUtil.contentMD5(config)}\n` +
            `${SignUtil.headers(signHeaders)}${SignUtil.url(config)}`;
        console.log('待签名字符串:', JSON.stringify(strSign));

        const key = Buffer.from(SignUtil.APP_SECRET, 'utf8');
        const message = Buffer.from(strSign, 'utf8');
        const hash = crypto.createHmac('sha256', key).update(message).digest();
        return hash.toString('base64');
    },

    /**
     * 请求方式大写
     * @param {*} config
     * @returns {string}
     */
    httpMethod(config) {
        return config.method.toLocaleUpperCase();
    },

    /**
     * 请求参数执行 base64 + md5 的值
     * get 请求直接返回空字符串，无需处理
     * @param {*} config
     * @returns {string}
     */
    contentMD5(config) {
        if (config.method === 'post' && config.data) {
            const bodyData = Buffer.from(JSON.stringify(config.data), 'utf8');
            return crypto.createHash('md5').update(bodyData).digest('base64');
        } else {
            return '';
        }
    },

    /**
     * 签名计算 Header 的 Key 拼接
     * @param {*} signHeaders
     * @returns {string}
     */
    headers(signHeaders) {
        let str = '';
        const sortData = SignUtil.objSort(signHeaders);
        const list = Object.keys(sortData).filter((key) => {
            return key !== 'S-Ca-Signature-Headers' && key !== 'Content-MD5';
        });
        list.forEach((key) => {
            const value = sortData[key];
            str += `${key}:${value ? value : ''}\n`;
        });
        return str;
    },

    /**
     * url 拼接
     * post 直接返回 path，get 有参数的情况下拼接 url
     * @param {*} config
     * @returns {string}
     */
    url(config) {
        const reqData = config.params || config.data;
        const path = `/${
            config.url
                .split('/')
                .slice(3)
                .join('/')
                .split('?')[0]
        }`;
        // Query 参数为空时 Url = Path，不添加 "?"；Value 为空时只保留 Key，不加 "="
        const hasQuery =
            reqData &&
            Object.keys(reqData).length > 0 &&
            config.method === 'get';
        if (hasQuery) {
            const sortObj = SignUtil.objSort(reqData);
            const keyList = Object.keys(sortObj);
            let query = '';
            keyList.forEach((key, index) => {
                const value = sortObj[key];
                if (value) {
                    query += `${key}=${value}${keyList.length - 1 === index ? '' : '&'}`;
                } else {
                    query += `${key}${keyList.length - 1 === index ? '' : '&'}`;
                }
            });
            return `${path}?${query}`;
        } else {
            return path;
        }
    },

    /**
     * 字符串转 UTF-8 字节数组
     * @param {string} str
     * @returns {number[]}
     */
    strToUtf8Bytes(str) {
        const utf8 = [];
        for (let ii = 0; ii < str.length; ii++) {
            let charCode = str.charCodeAt(ii);
            if (charCode < 0x80) utf8.push(charCode);
            else if (charCode < 0x800) {
                utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
            } else if (charCode < 0xd800 || charCode >= 0xe000) {
                utf8.push(
                    0xe0 | (charCode >> 12),
                    0x80 | ((charCode >> 6) & 0x3f),
                    0x80 | (charCode & 0x3f)
                );
            } else {
                ii++;
                // Surrogate pair:
                // UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and
                // splitting the 20 bits of 0x0-0xFFFFF into two halves
                charCode =
                    0x10000 +
                    (((charCode & 0x3ff) << 10) | (str.charCodeAt(ii) & 0x3ff));
                utf8.push(
                    0xf0 | (charCode >> 18),
                    0x80 | ((charCode >> 12) & 0x3f),
                    0x80 | ((charCode >> 6) & 0x3f),
                    0x80 | (charCode & 0x3f)
                );
            }
        }
        // 兼容汉字，ASCII 码表最大的值为 127，大于 127 的值为特殊字符
        for (let jj = 0; jj < utf8.length; jj++) {
            const code = utf8[jj];
            if (code > 127) {
                utf8[jj] = code - 256;
            }
        }
        return utf8;
    },

    /**
     * 对象 Key 按照字典排序
     * todo:这块需要研究，深层次的数据结构，是否做到了字典排序
     * @param {*} arys
     * @returns {*}
     */
    objSort(arys) {
        const newkey = Object.keys(arys).sort();
        const newObj = {};
        for (let i = 0; i < newkey.length; i++) {
            newObj[newkey[i]] = arys[newkey[i]];
        }
        return newObj;
    },
};

module.exports = SignUtil;
