

const weixinService = require('../services/platforms/weixinService');

exports.getOpenid = async (req, res, next) => {
  try {
    const { code } = req.query;
    const data = await weixinService.getOpenid(code);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.getUserPhoneNumber = async (req, res, next) => {
  try {
    const { code } = req.query;
    const data = await weixinService.getUserPhoneNumber(code);
    res.json(data);
  } catch (error) {
    next(error);
  }
}