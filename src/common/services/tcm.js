/**
 * @ Author: Rongxis
 * @ Create Time: 2024-12-12 11:48:57
 * @ Modified by: Rongxis
 * @ Modified time: 2024-12-17 15:02:32
 * @ Description: 加签逻辑
 */

import CryptoJS from '@common/packages/crypto-js/index'

/**
 * 生成随机字符串
 * @param {number} length - 随机字符串的长度
 * @returns {string} 随机生成的字符串
 */
function getRandomString(length = 15) {
  const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) result += str[Math.floor(Math.random() * str.length)];
  return result;
}

/**
 * 将对象转换为查询字符串
 * @param {Object} obj - 需要转换的对象
 * @returns {string} 转换后的查询字符串
 */
function toQueryString(obj) {
  if (!obj) return '';
  const res = [];
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (![undefined, null, ''].includes(val)) {
      res.push(`${key}=${val}`);
    }
  });
  return res.length ? `${res.join('&')}` : '';
}

/**
 * 生成签名请求头
 * @param {Object} body - 请求体数据
 * @returns {Object} 包含签名的请求头
 */
export default function tcm(body) {
  const headers = {};
  const TcmAppId = 'tcm_owner';
  const AppKey = 'O_zas9by';
  const TcmTimestamp = new Date().getTime();
  const TcmNoncestr = getRandomString();
  const stringifyData =
    toQueryString({
      appid: TcmAppId,
      key: AppKey,
      timestamp: TcmTimestamp,
      noncestr: TcmNoncestr
    }) + `&${JSON.stringify(body)}`; // 如果参数为空，则用空字符串参与签字
  headers['tcm-sign'] = String(CryptoJS.HmacSHA256(stringifyData, AppKey)).toUpperCase();
  headers['tcm-appid'] = TcmAppId;
  headers['tcm-timestamp'] = TcmTimestamp;
  headers['tcm-noncestr'] = TcmNoncestr;
  headers['tcm-flag'] = '1'; // String类型，控制是否开启加签认证，1开启，0关闭
  return headers;
};
