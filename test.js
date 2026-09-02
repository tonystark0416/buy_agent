
require('dotenv').config();

const {getOrderInfo,getGoodsInfo} = require('./services/platforms/meituanService.js');



// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {
    searchText:'鸡翅',
   productViewSignList:"DALMNW42ECGBNCIJATIMBTW3XI"
}

getGoodsInfo(obj).then(res => {
    console.log(res.data);
}).catch(err => {
    console.error(err);
});

