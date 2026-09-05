
require('dotenv').config();

const {getOrderInfo,getGoodsInfo} = require('./services/platforms/meituanService.js');
const {genByGoodsId} = require('./services/platforms/vipService.js');
const {tranUrlByGoodsId} = require('./services/adpTranUrlService.js');


// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {goodsId:'6921788910089450713',platform:'vip', uid:'175', pid:'123213'}

tranUrlByGoodsId(obj).then(res => {
    console.log(JSON.stringify(res));
}).catch(err => {
    console.error(err);
});

