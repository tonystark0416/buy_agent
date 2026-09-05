
require('dotenv').config();

const {getOrderInfo,getGoodsInfo} = require('./services/platforms/meituanService.js');
const {getGoodsMarketPrice} = require('./services/platforms/vipService.js');


// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {goodsId:'6921788910089450713', openid:'175', chanTag:'123213'}

getGoodsMarketPrice(obj).then(res => {
    console.log(JSON.stringify(res));
}).catch(err => {
    console.error(err);
});

