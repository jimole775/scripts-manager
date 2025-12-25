/**
 * 时间处理工具
 */

/**
 * 截去时间戳的前后4位，如果位数不够，用0填充
 * @param {number|string} timestamp - 时间戳
 * @returns {string} 处理后的时间字符串
 */
export function skin_time(timestamp) {
    const t_str = String(timestamp);
    const [s, ss] = t_str.split('.');
    let new_ss = ss || '';
    const ln = new_ss.length;
    
    if (ln < 7) {
        new_ss = new_ss + '0'.repeat(7 - ln);
    }
    
    return s.substring(4) + '.' + new_ss.substring(0, new_ss.length - 4);
}