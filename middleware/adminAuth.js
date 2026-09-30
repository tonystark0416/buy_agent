/**
 * 后台管理鉴权中间件
 * 校验 Authorization: Bearer <token>，token 由 /api/admin/auth/login 签发
 * 注意：使用独立的 ADMIN_JWT_SECRET，与 C 端 JWT 完全隔离
 */
const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

if (!ADMIN_JWT_SECRET) {
  // 未配置时使用开发兜底密钥，生产环境务必在 .env 中配置 ADMIN_JWT_SECRET
  console.warn('[adminAuth] 未配置 ADMIN_JWT_SECRET 环境变量，当前使用开发兜底密钥，仅限本地调试');
}

const SECRET = ADMIN_JWT_SECRET || 'buy_agent_admin_dev_secret';

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: 401, msg: '未登录', data: null });
  }
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.type !== 'admin') {
      return res.status(401).json({ code: 401, msg: 'token 类型无效', data: null });
    }
    req.admin = decoded; // { adminId, username, role, type }
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: '登录已过期，请重新登录', data: null });
  }
}

module.exports = adminAuth;
module.exports.ADMIN_JWT_SECRET = SECRET;

/**
 * 写操作鉴权：在登录校验基础上，拦截 readonly 角色的写请求
 * 用法：router.post('/xxx', adminWriteAuth, handler)
 */
function adminWriteAuth(req, res, next) {
  adminAuth(req, res, () => {
    if (req.admin.role === 'readonly') {
      return res.status(403).json({ code: 403, msg: '当前账号为只读角色，无权执行写操作', data: null });
    }
    next();
  });
}
module.exports.adminWriteAuth = adminWriteAuth;
