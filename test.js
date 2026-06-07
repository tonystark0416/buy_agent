
const {checkUser,getAuthUrl,unbindOpenId} = require('./services/platforms/vipService.js');

// 调试代码
// let obj = {
//     goodsId: '6921500060852441693',
//     openId: 'testOpenId123',
//     chanTag: 'testChanTag456',
//     statParam: 'testStat789',
//     genAuthorityUrl: false,
//     // giftCode: 'TESTGIFT202406'
// }
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

unbindOpenId('mike002').then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
})