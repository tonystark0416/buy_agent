
require('dotenv').config();

const {tranUrl} = require('./services/adpTranUrlService.js');



// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {
    uid: 175,
    pid: '43384525_317172887',
    source_url: 'https://t.vip.com12321/g5qrsq'
}

tranUrl(obj).then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
});

