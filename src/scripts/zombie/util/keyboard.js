/**
 * 键盘操作工具
 */
const robot = require('robotjs');

// 假设配置
const config = {
    CMD: {
        random_type: {
            key: 'random'
        }
    },
    HOTKEY: {
        // 功能键配置
    }
};

const RANDOM_TYPE_KEY = config.CMD.random_type.key;

/**
 * 获取键的字符类型
 * @param {string|number|Array} src - 键
 * @returns {string|Array} 字符类型的键
 */
export function get_key_char(src) {
    return _transform_handler('char', src);
}

/**
 * 获取键的数字类型
 * @param {string|number|Array} src - 键
 * @returns {string|Array} 数字类型的键
 */
export function get_key_code(src) {
    // 统一转成字符串
    if (typeof src === 'number') {
        return String(src);
    } else {
        return _transform_handler('code', src);
    }
}

/**
 * 获取键的对象类型
 * @param {string|number|Array} src - 键
 * @returns {Object|Array} 键对象
 */
export function get_keyboard_key(src) {
    return _transform_handler('key', src);
}

/**
 * 检查是否是随机键
 * @param {string|Array} key_or_comb - 键或组合键
 * @returns {boolean} 是否是随机键
 */
export function is_random_key(key_or_comb) {
    const keys = get_keyboard_key(key_or_comb);
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    const random_keys = get_keyboard_key(RANDOM_TYPE_KEY);
    return compare_keys(keysArray, random_keys);
}

/**
 * 检查是否包含随机键
 * @param {string|Array} key_or_comb - 键或组合键
 * @returns {boolean} 是否包含随机键
 */
export function include_random_key(key_or_comb) {
    let res = false;
    const keys = get_keyboard_key(key_or_comb);
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    const random_keys = get_keyboard_key(RANDOM_TYPE_KEY);
    const randomKeysArray = Array.isArray(random_keys) ? random_keys : [random_keys];
    
    for (const key of keysArray) {
        if (randomKeysArray.includes(key)) {
            res = true;
            break;
        }
    }
    
    return res;
}

/**
 * 检查是否包含功能键
 * @param {string|Array} key_or_comb - 键或组合键
 * @returns {boolean} 是否包含功能键
 */
export function include_function_key(key_or_comb) {
    let res = false;
    const keys = get_keyboard_key(key_or_comb);
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    for (const fn_type in config.HOTKEY) {
        const name_map = config.HOTKEY[fn_type];
        for (const fn_name in name_map) {
            const fn_info = name_map[fn_name];
            const fn_keys = get_keyboard_key(fn_info.key);
            const fnKeysArray = Array.isArray(fn_keys) ? fn_keys : [fn_keys];
            
            for (const key of keysArray) {
                if (fnKeysArray.includes(key)) {
                    res = true;
                    break;
                }
            }
            if (res) break;
        }
        if (res) break;
    }
    
    return res;
}

/**
 * 判断是否是功能键
 * @param {string|Array} key_or_comb - 键或组合键
 * @returns {boolean} 是否是功能键
 */
export function is_function_key(key_or_comb) {
    let res = false;
    const key_char = get_key_char(key_or_comb);
    
    for (const fn_type in config.HOTKEY) {
        const name_map = config.HOTKEY[fn_type];
        for (const fn_name in name_map) {
            const fn_info = name_map[fn_name];
            const fn_key_char = get_key_char(fn_info.key);
            
            if (compare_keys(fn_key_char, key_char)) {
                res = true;
                break;
            }
        }
        if (res) break;
    }
    
    return res;
}

/**
 * 比对两个键是否相等
 * @param {any} l_k - 左侧键
 * @param {any} r_k - 右侧键
 * @returns {boolean} 是否相等
 */
export function compare_keys(l_k, r_k) {
    const l_code = get_key_char(l_k);
    const r_code = get_key_char(r_k);
    
    if (Array.isArray(l_code) && Array.isArray(r_code)) {
        return JSON.stringify(l_code.sort()) === JSON.stringify(r_code.sort());
    }
    
    return l_code === r_code;
}

/**
 * 扁平化辅助键（如 ctrl_l -> ctrl）
 * @param {string} key - 键名
 * @returns {string} 扁平化后的键名
 */
export function flat_asst_key(key) {
    const signs = ['ctrl', 'alt', 'shift'];
    const key_char = key;
    let res = key;
    
    for (const sign of signs) {
        if (key_char.startsWith(sign)) {
            res = sign;
            break;
        }
    }
    
    return res;
}

/**
 * 转换单个键
 * @private
 * @param {string} exp_t - 转换类型 'code', 'char', 'key'
 * @param {any} src - 源键
 * @returns {any} 转换后的键
 */
function _eval_single(exp_t, src) {
    let res = src;
    const s_type = typeof src;
    
    if (exp_t === 'code') { // 返回 code
        if (s_type === 'string') { // char 转 code
            if (src.length === 1) {
                res = src.toUpperCase().charCodeAt(0);
            } else {
                // 在Node.js中，我们直接返回键名
                res = src;
            }
        }
        // 其他类型直接返回
    }
    
    if (exp_t === 'char') { // 返回 char
        if (s_type === 'number') { // int 转 char
            res = String.fromCharCode(src).toLowerCase();
        } else if (s_type === 'string') {
            res = flat_asst_key(src);
        }
    }
    
    if (exp_t === 'key') { // 返回 key 对象
        // 在Node.js中，我们直接返回字符串
        res = src;
    }
    
    return res;
}

/**
 * 转换组合键
 * @private
 * @param {string} exp_t - 转换类型
 * @param {Array} comb_key_list - 组合键列表
 * @returns {Array} 转换后的组合键列表
 */
function _eval_comb(exp_t, comb_key_list) {
    const res = [];
    
    for (const key of comb_key_list) {
        let _key = _eval_single(exp_t, key);
        if (exp_t === 'char') {
            _key = flat_asst_key(_key);
        }
        res.push(_key);
    }
    
    return res;
}

/**
 * 转换处理器
 * @private
 * @param {string} exp_t - 转换类型
 * @param {any} src - 源键
 * @returns {any} 转换后的键
 */
function _transform_handler(exp_t, src) {
    let res = null;
    const key_type = typeof src;
    
    // 组合键
    if (Array.isArray(src)) {
        res = _eval_comb(exp_t, src);
    }
    // 字符串
    else if (key_type === 'string') {
        if (src.includes('+')) {
            res = _eval_comb(exp_t, src.split('+'));
        } else {
            res = _eval_single(exp_t, src);
        }
    }
    // 单键
    else {
        res = _eval_single(exp_t, src);
    }
    
    return res;
}