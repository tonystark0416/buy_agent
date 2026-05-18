/**
 * User Service 
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel.js'); 


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
};