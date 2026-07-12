
require('dotenv').config();

const {orderList,checkUser,getGoodsMarketPrice,getAuthUrl,unbindOpenId,goodsListV2} = require('./services/platforms/vipService.js');

const {loginByPassword,register,loginByOpenid} = require('./services/apdUserService.js');




// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })

register('131435102634', null,'fdasfdsaf').then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
});
