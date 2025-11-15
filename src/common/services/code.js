/**
 * @ Author: Rongxis
 * @ Create Time: 2024-12-12 15:03:43
 * @ Modified by: Rongxis
 * @ Modified time: 2024-12-12 16:06:49
 * @ Description: 加解密逻辑
 */

// 全局AES
import CryptoJS from '@common/packages/crypto-js/index'

const keys = 'pa.xxxxx';
const ivs = 'pa.xxxxx';

export function Encrypt(word) {
  let key = keys;
  let iv = ivs;

  key = CryptoJS.enc.Utf8.parse(key);
  iv = CryptoJS.enc.Utf8.parse(iv);

  let srcs = CryptoJS.enc.Utf8.parse(word);
  let encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}

export function Decrypt(word) {
  let key = keys;
  let iv = ivs;

  key = CryptoJS.enc.Utf8.parse(key);
  iv = CryptoJS.enc.Utf8.parse(iv);
  let base64 = CryptoJS.enc.Base64.parse(word);
  let src = CryptoJS.enc.Base64.stringify(base64);

  var decrypt = CryptoJS.AES.decrypt(src, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  let str = decrypt.toString(CryptoJS.enc.Utf8);

  let json = {};
  if (str !== '') {
    json = JSON.parse(str);
  }
  return json;
}
