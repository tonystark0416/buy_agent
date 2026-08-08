
require('dotenv').config();

const {orderList,checkUser,getGoodsMarketPrice,getAuthUrl,unbindOpenId,goodsListV2} = require('./services/platforms/vipService.js');
const {urlGen} = require('./services/platforms/pddService.js');

const {genAuthUrl,checkAuth} = require('./services/platforms/pddService.js');



// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {
    uid: 175,
    pid: '43384525_317172887',
    source_url: 'https://p.pinduoduo.com/Oo6qC5VF?sc=EFAC'
}

urlGen(obj).then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
});

// checkAuth(obj).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// });