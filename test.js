
const {orderList,checkUser,getGoodsMarketPrice,getAuthUrl,unbindOpenId,goodsListV2} = require('./services/platforms/vipService.js');

// 调试代码
let obj = {
    goodsId: '6921542524282429649',
    content:'https://detail.vip.com/detail-1713405670-6921288524600447174.html'
    // offset: 0,
}
// checkUser('mike002').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })

// getAuthUrl('mike002').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })

orderList(obj).then(res => {
    console.log(res.result);
}).catch(err => {
    console.error(err);
})
