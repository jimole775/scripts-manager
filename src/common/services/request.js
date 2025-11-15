/**
 * @ Author: Rongxis
 * @ Create Time: 2024-12-12 09:13:01
 * @ Modified by: Rongxis
 * @ Modified time: 2024-12-17 16:22:32
 * @ Description: 公共请求方法，默认加签 和 token 注入
 */

import http from 'http'
import genTcm from './tcm'
import { get } from './store'
const hostMap = get('host.map');
import { takeToken } from './token'
const defHeader = {
  'Content-Type': 'application/json',
  'X-Router-Auth-Type': 'pacust',
  'X-Router-Auth-Namespace': 'web'
};

/**
 * 请求方法，已集成加签逻辑
 * 以下的参数，带星号的必填
 * @param {Object} option { *path, env, method, data, headers, host, port, account }
 * @returns Promise<any>
 */
export default async function request(option = {}) {
  const env = option.env || 'dev';
  const account = option.account || 'admin';
  // 先拿 token
  const token = await takeToken(env, account);
  const {
    host = hostMap[env].host,
    port = hostMap[env].port,
    method = 'POST',
    path = '',
    data = {},
    headers = {}
  } = option;
  return new Promise((resolve, reject) => {
    let dataQueue = [];
    const req = http.request(
      {
        hostname: host,
        port: port,
        path: path,
        method: method,
        headers: {
          ...defHeader, // 默认头
          ...genTcm(data), // 加签逻辑
          ...headers, // 额外的请求头
          'X-Authorization': `Bearer ${token}`
        }
      },
      (res) => {
        res.setEncoding('utf8');
        // 监听数据的传输
        res.on('data', (chunk) => {
          // 存储 数据 片段
          dataQueue.push(chunk);
        });
        // 监听结束信号
        res.on('end', () => {
          if (dataQueue.length) {
            // 数据请求完毕后，把 chunks 系列化成字符串
            // 因为 系统 的数据都是以 JSON 为主，所以这里用 JSON.parse() 再转一下
            resolve(JSON.parse(dataQueue.join('')));
          } else {
            resolve('');
          }
        });
      }
    );

    req.on('error', (e) => {
      reject(e.message);
      console.error(`problem with request: ${e.message}`);
    });

    // 发送请求信息
    req.write(JSON.stringify(data));
    req.end();
  });
};
