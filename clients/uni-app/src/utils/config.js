/**
 * 接口 Host 按编译目标下发：
 * - App（iOS/Android）：直连正式域名
 * - H5：同源部署（/app 下），走相对路径无跨域
 */
let BASE_URL = 'https://hgh.pangpai-car.com'

// #ifdef H5
BASE_URL = ''
// #endif

export { BASE_URL }
