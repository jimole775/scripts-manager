/**
 * 函数调用工具集
 */

/**
 * 应用函数与参数
 * @param {Function} func - 要调用的函数
 * @param {Array} params - 参数数组
 * @example apply(func, [param1, param2])
 */
export function apply(func, params = []) {
    if (typeof func === 'function') {
        __core__(func, params);
    }
}

/**
 * 调用函数
 * @param {Function} func - 要调用的函数
 * @param {...any} args - 任意数量的参数
 * @example call(func, param1, param2)
 */
export function call(func, ...args) {
    if (typeof func === 'function') {
        __core__(func, args);
    }
}

/**
 * 核心调用函数
 * @private
 * @param {Function} func - 要调用的函数
 * @param {Array} params - 参数数组
 */
function __core__(func, params) {
    const paramDict = {};
    
    // 获取函数的参数名
    const funcStr = func.toString();
    const paramNames = funcStr
        .slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')'))
        .replace(/\s+/g, '')
        .split(',')
        .filter(param => param && param !== 'self');
    
    if (paramNames.length > 0 && params.length > 0) {
        // 将参数列表和参数值拼成对象
        paramNames.forEach((paramName, index) => {
            if (index < params.length) {
                paramDict[paramName] = params[index];
            }
        });
    }
    
    // 调用函数
    func.call(null, ...params);
}