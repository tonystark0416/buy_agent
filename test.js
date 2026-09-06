
require('dotenv').config();

const {getOrderInfo,getGoodsInfo} = require('./services/platforms/meituanService.js');
const {genByGoodsId} = require('./services/platforms/vipService.js');
const {tranUrlByGoodsId} = require('./services/adpTranUrlService.js');
const {formatBeijing}= require('./utils/timeUtils.js');

loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
})
let obj = {queryTimeType, startTime, endTime, page, platform}

getOrderInfo(obj).then(res => {
    console.log(JSON.stringify(res));
}).catch(err => {
    console.error(err);
});

// console.log(new Date(1788144410000).toLocaleString())
// console.log(formatBeijing(new Date(1788144410000)))