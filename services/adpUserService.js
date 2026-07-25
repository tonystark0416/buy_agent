/**
 * 认证服务
 * 负责处理用户登录、注册等认证相关的业务逻辑
 * 依赖 UserModel 和 CodeModel 进行数据操作
 * 使用 bcryptjs 进行密码哈希，jsonwebtoken 进行 JWT 签发
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/adpUser.js');
// const CodeModel = require('../models/VerificationCode');

const JWT_SECRET = '19910416'; // 替换为你的 JWT 密钥
const JWT_EXPIRES_IN = '1h'; // JWT 过期时间


//---- openid联合登陆----、
//通过查找openid是否有绑定的uid进行登陆
async function loginByOpenid(openid) {
  const user = await UserModel.findByOpenid(openid);
  if (!user) throw new Error('该openid未绑定账号');
  const token = generateToken(user);
  return { user: formatUser(user), token };
}



//---- 手机+密码登陆----
async function loginByPassword(phone, password) {
  const user = await UserModel.findByPhone(phone);
  if (!user) throw new Error('手机号未注册');
  if (!user.password) throw new Error('该账号未设置密码，请使用验证码登录');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('密码错误');
  const token = generateToken(user);
  return { user: formatUser(user), token };
}


// ------------- 用户注册（手机号 + 密码 + openid） -------------
//支持单纯手机号注册并登陆
//支持手机号+openid注册并登陆
//支持手机号+密码注册并登陆
async function register(phone, password, openid) {

  //支持单纯手机号注册并登陆
  const existingUser = await UserModel.findByPhone(phone);
  if (existingUser) {
    throw new Error('该手机号已注册，请直接登录');
  }

  //支持手机号+密码注册并登陆
  if (password) {
    if (!password || password.length < 6) { //校验密码长度（至少6位）
      throw new Error('密码不能少于6位');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser(phone, passwordHash, openid);
    //签发 token
    const token = generateToken(user);
    return { user: formatUser(user), token };
  }

  //支持手机号+openid注册并登陆
  if (openid) {
    const existingOpenidUser = await UserModel.findByOpenid(openid);
    if (existingOpenidUser) {
      throw new Error('该openid已绑定其他账号，请使用其他openid或解绑后再注册');
    }
    const user = await UserModel.createUser(phone, null, openid);
    //签发 token
    const token = generateToken(user);
    return { user: formatUser(user), token };
  }

  const user = await UserModel.createUser(phone);

  //签发 token
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
  register,
  loginByOpenid
};