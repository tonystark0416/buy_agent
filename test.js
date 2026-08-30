
require('dotenv').config();

const {genUrl} = require('./services/platforms/jdService.js');



// loginByOpenid('1oQh9360gmrfyT-xh0NApYkmgECtM').then(res => {
//     console.log(res);
// }).catch(err => {
//     console.error(err);
// })
let obj = {
   materialId:'https://u.jd.com/kg4YTz2'
}

genUrl(obj).then(res => {
    console.log(res.jd_union_open_promotion_bysubunionid_get_responce.getResult);
}).catch(err => {
    console.error(err);
});

