
require('dotenv').config();

const {orderList,checkUser,getGoodsMarketPrice,getAuthUrl,unbindOpenId,goodsListV2} = require('./services/platforms/vipService.js');


const {genAuthUrl,checkAuth} = require('./services/platforms/pddService.js');



// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {
    uid: 6546546546,
    pid: '43384525_309735569'
}

genAuthUrl(obj).then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
});

// checkAuth(obj).then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// });