/**
 * 
 * 淘宝CPS联盟接口封装
 */

require('dotenv').config({
	path: require('path').resolve(__dirname, '../../.env'),
});

const crypto = require('crypto');
const axios = require('axios');
const config = require('../../config/config.js');

const API_URL = 'https://eco.taobao.com/router/rest';

function formatTimestamp(date = new Date()) {
	const pad = (value) => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function createSign(params, appSecret) {
	const source = Object.keys(params)
		.sort()
		.map((key) => `${key}${params[key]}`)
		.join('');

	return crypto
		.createHash('md5')
		.update(`${appSecret}${source}${appSecret}`)
		.digest('hex')
		.toUpperCase();
}

function normalizeAdzoneId(adzoneId) {
	const value = String(adzoneId);
	const normalizedAdzoneId = value.startsWith('mm_')
		? value.split('_')[3]
		: value;

	if (!normalizedAdzoneId) {
		throw new Error('adzoneId 格式不正确');
	}

	return normalizedAdzoneId;
}

async function taobaoOpenApiRequest(method, bizParams = {}) {
	const { appKey, appSecret } = config.taobao_cps_key;

	if (!appKey || !appSecret) {
		throw new Error('缺少 TB_CPS_APPKEY 或 TB_CPS_APPSECRET');
	}

	const params = {
		method,
		app_key: appKey,
		timestamp: formatTimestamp(),
		v: '2.0',
		sign_method: 'md5',
		format: 'json',
		...bizParams,
	};
	Object.keys(params).forEach((key) => {
		if (params[key] === undefined || params[key] === null || params[key] === '') {
			delete params[key];
		}
	});
	params.sign = createSign(params, appSecret);

	const response = await axios.get(API_URL, {
		params,
		timeout: 20000,
	});

	if (response.data?.error_response) {
		const error = response.data.error_response;
		throw new Error(`${error.sub_code || error.code}: ${error.sub_msg || error.msg}`);
	}

	return response.data;
}


/**
 * 获取活动链接
 * https://open.taobao.com/api.htm?docId=48340&docType=2&scopeId=18294
 * @param {*} param0 
 * @returns 
 */
async function getActivityInfo({ activityMaterialId, adzoneId, subPid, relationId, unionId } = {}) {
	if (!activityMaterialId || !adzoneId) {
		throw new Error('activityMaterialId 和 adzoneId 不能为空');
	}
	const normalizedAdzoneId = normalizeAdzoneId(adzoneId);

	return taobaoOpenApiRequest('taobao.tbk.activity.info.get', {
		activity_material_id: activityMaterialId,
		adzone_id: normalizedAdzoneId,
		sub_pid: subPid,
		relation_id: relationId,
		union_id: unionId,
	});
}

/**
 * 淘宝客商品链接转换 ，（暂时无权限）
 * 接口：taobao.tbk.item.convert
 */
async function convertItemLink({
	numIids,
	adzoneId,
	fields = 'num_iid,click_url',
	platform,
	unid,
	dx,
} = {}) {
	if (!numIids || !adzoneId || !fields) {
		throw new Error('numIids、adzoneId 和 fields 不能为空');
	}

	const normalizedNumIids = Array.isArray(numIids)
		? numIids.join(',')
		: String(numIids);

	return taobaoOpenApiRequest('taobao.tbk.item.convert', {
		fields,
		num_iids: normalizedNumIids,
		adzone_id: normalizeAdzoneId(adzoneId),
		platform,
		unid,
		dx,
	});
}

/**
 * 获取淘宝客权益物料推广
 * 接口：taobao.tbk.dg.optimus.promotion
 */
async function getOptimusPromotion({
	pageSize = 10,
	pageNum = 1,
	adzoneId,
	promotionId,
} = {}) {
	if (!adzoneId || !promotionId) {
		throw new Error('adzoneId 和 promotionId 不能为空');
	}

	return taobaoOpenApiRequest('taobao.tbk.dg.optimus.promotion', {
		page_size: pageSize,
		page_num: pageNum,
		adzone_id: normalizeAdzoneId(adzoneId),
		promotion_id: promotionId,
	});
}

/**
 * 淘宝客推广者物料精选升级版
 * 接口：taobao.tbk.dg.material.recommend
 */
async function getMaterialRecommend({
	pageSize = 20,
	pageNo = 1,
	materialId,
	adzoneId,
	relationId,
	deviceType,
	deviceEncrypt,
	deviceValue,
	favoritesId,
	promotionType,
	specialId,
	itemId,
} = {}) {
	if (!materialId || !adzoneId) {
		throw new Error('materialId 和 adzoneId 不能为空');
	}

	return taobaoOpenApiRequest('taobao.tbk.dg.material.recommend', {
		page_size: pageSize,
		page_no: pageNo,
		material_id: materialId,
		adzone_id: normalizeAdzoneId(adzoneId),
		relation_id: relationId,
		device_type: deviceType,
		device_encrypt: deviceEncrypt,
		device_value: deviceValue,
		favorites_id: favoritesId,
		promotion_type: promotionType,
		special_id: specialId,
		item_id: itemId,
	});
}

module.exports = {
	getActivityInfo,
	convertItemLink,
	getOptimusPromotion,
	getMaterialRecommend,
};

