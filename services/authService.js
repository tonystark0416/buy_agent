/**
 * 认证服务
 * 负责处理用户登录、注册等认证相关的业务逻辑
 * 依赖 UserModel 和 CodeModel 进行数据操作
 * 使用 bcryptjs 进行密码哈希，jsonwebtoken 进行 JWT 签发
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User.js'); 
// const CodeModel = require('../models/VerificationCode');

const JWT_SECRET = '19910416'; // 替换为你的 JWT 密钥
const JWT_EXPIRES_IN = '1h'; // JWT 过期时间

//---- 密码登陆----
async function loginByPassword(phone, password) {
    const user = await UserModel.findByPhone(phone);
    if (!user) throw new Error('手机号未注册');
    if (!user.password) throw new Error('该账号未设置密码，请使用验证码登录');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error('密码错误');
    const token = generateToken(user);
    return { user: formatUser(user),token };
}


// ------------- 用户注册（手机号 + 密码） -------------
async function register(phone, password) {
  // 1. 校验密码长度（至少6位）
  if (!password || password.length < 6) {
    throw new Error('密码不能少于6位');
  }

  // 2. 检查手机号是否已注册
  const existingUser = await UserModel.findByPhone(phone);
  if (existingUser) {
    throw new Error('该手机号已注册，请直接登录');
  }

  // 3. 对密码进行哈希加密
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. 创建用户
  const user = await UserModel.createUser(phone, passwordHash);

  // 5. 签发 token
  const token = generateToken(user);
  return { user: formatUser(user), token };
}




// ------------- 工具函数 -------------
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
  };
}

module.exports = {
    loginByPassword,
    register
};