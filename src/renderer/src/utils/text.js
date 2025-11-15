/**
 * @ Author: Rongxis
 * @ Create Time: 2025-03-05 10:17:48
 * @ Description: 文本处理
 */

export function dash2camel (str = '') {
  return str
  .split('-') // 将字符串按 '-' 分割成数组
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // 将每个单词的首字母大写
  .join(''); // 将数组重新连接成字符串
}
