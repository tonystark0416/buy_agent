const CryptoJS = require('crypto-js');

function generateSign(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const rawStr = sortedKeys.map(k => `${k}${params[k]}`).join('');
  const signStr = secret + rawStr + secret;
  return CryptoJS.MD5(signStr).toString(CryptoJS.enc.Hex).toUpperCase();
}

module.exports = { generateSign };