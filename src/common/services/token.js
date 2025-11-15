/**
 * @ Author: Rongxis
 * @ Create Time: 2024-12-12 15:36:12
 * @ Modified by: Rongxis
 * @ Modified time: 2024-12-17 16:28:53
 * @ Description: 根据用户账密获取 token，并缓存到内存中
 */
import http from 'http'
import { Encrypt, Decrypt } from './code'
import JSEncrypt from '@common/packages/jsencrypt.min'
import genTcm from './tcm'
import { set, get } from './store'
const hostMap = get('host.map');
const passwordMap = get('password.map');
// token 缓存失效的间隔 30 分钟
const validateDiff = 30 * 60 * 1000;
const defHeader = {
  'Content-Type': 'application/json',
  'X-Router-Auth-Type': 'pacust',
  'X-Router-Auth-Namespace': 'web'
};

/**
 * 生成Token
 * @param {string} env - 环境名称
 * @returns {Promise<string>} - 返回生成的Token
 */
export async function genToken(env, account) {
  const body = {
    account: account, // 账号
    password: passwordMap[env][account], // 密码
    loginType: 3 // 请求类型：1- 未知；2- 未知；3- 未知；
  };
  return new Promise((resolve, reject) => {
    let dataChunks = [];
    const req = http.request(
      {
        hostname: hostMap[env].host,
        port: hostMap[env].port,
        path: '/auth/token/apply',
        headers: {
          ...defHeader,
          ...genTcm(body),
          code: '1',
          'X-Security-AesKeySecret': genAesKeySecret() // 登录请求时的AES密钥
        },
        method: 'POST'
      },
      (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          // 存储 数据 片段
          dataChunks.push(chunk);
        });
        res.on('end', () => {
          const resStr = dataChunks.join('');
          // 登录请求，需要对返回的数据进行解码
          const { data } = Decrypt(resStr);
          // 缓存 token
          saveToken(env, account, data.token || '');
          console.log(`获取${env}token成功：`, data.token);
          resolve(data.token || '');
        });
      }
    );

    req.on('error', (e) => {
      reject(e.message);
      console.error(`problem with request: ${e.message}`);
    });
    req.write(Encrypt(JSON.stringify(body)));
    req.end();
  });
}

/**
 * 保存Token
 * @param {string} env - 环境名称
 * @param {string} token - 需要保存的Token
 */
export function saveToken(env, account, token) {
  set('token', env, account, {
    expired: Date.now() + validateDiff,
    value: token
  });
}

/**
 * 获取Token
 * @param {string} env - 环境名称
 * @returns {Promise<string>} - 返回获取的Token
 */
export async function takeToken(env, account) {
  const token = get('token', env, account);
  if (isTokenExpired(token)) {
    return await genToken(env, account);
  } else {
    return token.value;
  }
}

/**
 * 生成AES密钥
 * @returns {string} - 返回加密后的AES密钥
 */
function genAesKeySecret() {
  const aesKey = 'pa.xxx';
  const publicKey =
    'base64xxxxx';

  let encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  return encryptor.encrypt(aesKey);
}

/**
 * 判断Token是否过期，过期时间，30分钟
 * @param {Object} data - Token数据对象
 * @returns {boolean} - 返回Token是否过期
 */
function isTokenExpired(data = {}) {
  const expired = data.expired || 0;
  const now = Date.now();
  return expired - now < 0;
}
