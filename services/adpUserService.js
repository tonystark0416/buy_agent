/**
 * 认证服务
 * 负责处理用户登录、注册等认证相关的业务逻辑
 * 依赖 UserModel 和 CodeModel 进行数据操作
 * 使用 bcryptjs 进行密码哈希，jsonwebtoken 进行 JWT 签发
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const UserModel = require('../models/adpUserModel.js');

const JWT_SECRET = config.jwt.secret; // 缺失时 config 加载期即报错（fail-fast）
const JWT_EXPIRES_IN = config.jwt.expiresIn;


//---- openid联合登陆----、
//通过查找openid是否有绑定的uid进行登陆
async function loginByOpenid(openid) {
  const user = await UserModel.findByOpenid(openid);
  if (!user) throw new Error('该openid未绑定账号');
  return loginSuccess(user);
}

//---- 手机号 + 验证码登陆（预留：iOS / Android App 端使用）----
// 小程序当前走微信手机号一键授权，验证码通道为 App 端预留

// 验证码内存存储：Map<phone, { code, expiresAt, lastSentAt }>
// 注：单实例内存态，多实例部署需迁移 Redis/DB（见 docs 需求文档认证章节）
const codeStore = new Map();
const CODE_TTL = 5 * 60 * 1000;        // 5 分钟有效
const CODE_RESEND_INTERVAL = 60 * 1000; // 60 秒重发冷却

/**
 * 发送手机验证码
 * SMS 提供商集成点：接入服务商后在此调用其 SDK 发送短信；
 * 当前未配置（config.sms.provider 为空）时仅打印到服务端日志，且响应附 devCode 便于联调
 * @param {string} phone - 手机号
 * @returns {Promise<{ devCode?: string }>} devCode 仅在未接 SMS 服务商时返回
 */
async function sendVerificationCode(phone) {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确');
  }

  const record = codeStore.get(phone);
  if (record && Date.now() - record.lastSentAt < CODE_RESEND_INTERVAL) {
    throw new Error('发送过于频繁，请稍后再试');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  codeStore.set(phone, { code, expiresAt: Date.now() + CODE_TTL, lastSentAt: Date.now() });

  // ===== SMS 提供商集成点（阿里云/腾讯云短信等）=====
  const provider = config.sms && config.sms.provider;
  if (provider) {
    // TODO: 接入后调用 provider.send(phone, code)，并移除 devCode 透出
    console.log(`[SMS] (${provider}) 向 ${phone} 发送验证码: ${code}`);
    return {};
  }
  // 未接服务商：打印日志 + 返回 devCode（仅限开发联调）
  console.log(`[SMS] 未配置短信服务商，验证码已生成: ${phone} -> ${code}`);
  return { devCode: code };
}

/**
 * 手机号 + 验证码登录（预留：iOS / Android App 端）
 * - 验证码正确：已有账号直接登录；无账号自动注册（手机号即账号）
 * - 携带 openid 时自动完成 uid + openid 绑定
 * @param {Object} opts
 * @param {string} opts.phone  - 手机号
 * @param {string} opts.code   - 6 位验证码
 * @param {string} [opts.openid] - 微信 openid（可选，App 端不传）
 */
async function loginByCode({ phone, code, openid }) {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确');
  }
  if (!code) {
    throw new Error('验证码不能为空');
  }

  // ===== 联调期固定验证码：000000 可直接注册/登录（跳过验证码校验）=====
  // TODO: 短信服务商接入后（config.sms.provider 配置生效）移除此分支，恢复严格校验
  const FIXED_DEV_CODE = '000000';
  if (String(code).trim() !== FIXED_DEV_CODE) {
    const record = codeStore.get(phone);
    if (!record) throw new Error('请先获取验证码');
    if (Date.now() > record.expiresAt) {
      codeStore.delete(phone);
      throw new Error('验证码已过期，请重新获取');
    }
    if (record.code !== String(code).trim()) {
      throw new Error('验证码错误');
    }
    // 一次性使用，防重放
    codeStore.delete(phone);
  }

  // 已有账号：直接登录；携带 openid 时补绑定
  let user = await UserModel.findByPhone(phone);
  if (user) {
    if (openid && user.openid !== openid) {
      await UserModel.updateUserInfo(user, openid);
      user = { ...user, openid };
    }
    return loginSuccess(user);
  }

  // 无账号：验证码登录即注册
  user = await UserModel.createUser(phone, null, openid || null);
  return loginSuccess(user);
}

//---- 手机+密码登陆----
async function loginByPassword(phone, password) {
  const user = await UserModel.findByPhone(phone);
  if (!user) throw new Error('手机号未注册');
  if (!user.password) throw new Error('该账号未设置密码，请使用验证码登录');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('密码错误');
  return loginSuccess(user);
}


// ------------- 用户注册（手机号 + 密码 + openid） -------------
//支持单纯手机号注册并登陆
//支持手机号+openid注册并登陆
//支持手机号+密码注册并登陆
async function register({phone, password, openid}) {

  //支持单纯手机号注册并登陆
  const existingUser = await UserModel.findByPhone(phone);
  // console.log('existingUser:', existingUser);
  //查询到手机号记录，应该直接登录
  if (existingUser) {
    UserModel.updateUserInfo(existingUser, openid); //更新openid
    return loginSuccess(existingUser);
    // throw new Error('该手机号已注册，请直接登录');
  }

  //支持手机号+密码注册并登陆
  if (password) {
    if (!password || password.length < 6) { //校验密码长度（至少6位）
      throw new Error('密码不能少于6位');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser(phone, passwordHash, openid);
    return loginSuccess(user);
  }

  //支持手机号+openid注册并登陆
  if (openid) {
    const existingOpenidUser = await UserModel.findByOpenid(openid);
    if (existingOpenidUser) {
      throw new Error('该openid已绑定其他账号，请使用其他openid或解绑后再注册');
    }
    const user = await UserModel.createUser(phone, null, openid);
    return loginSuccess(user);
  }

  const user = await UserModel.createUser(phone);
  return loginSuccess(user);

}




// ------------- 工具函数 -------------

/** 统一登录成功返回：签发 token + 格式化用户 */
function loginSuccess(user) {
  const token = generateToken(user);
  return { user: formatUser(user), token };
}

function generateToken(user) {
  return jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}


function formatUser(user) {
  return {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    openid: user.openid,
  };
}



module.exports = {
  loginByPassword,
  register,
  loginByOpenid,
  sendVerificationCode,
  loginByCode
};