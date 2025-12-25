/**
 * 系统工具
 */
import Scaner from './scaner.js';
import Scissors from './scissors.js';

// 假设配置
const config = {
    ASSETS: {
        path: ''
    }
};

const scaner = new Scaner();
const scissors = new Scissors();

const sys_assets_path = `${config.ASSETS.path}\sys`;

/**
 * 获取图标路径
 * @param {string} name - 图标名称
 * @returns {string} 图标路径
 */
export function get_icon(name) {
    const icons = {
        'win.png': `${sys_assets_path}\\win10\\{}`,
        'en.png': `${sys_assets_path}\\win10\\{}`,
        'en_sg.png': `${sys_assets_path}\\win10\\{}`,
        'en_home.png': `${sys_assets_path}\\win10\\{}`,
        'cn.png': `${sys_assets_path}\\win10\\{}`,
        'cn_sg.png': `${sys_assets_path}\\win10\\{}`,
        'cn_home.png': `${sys_assets_path}\\win10\\{}`
    };
    
    return icons[name].replace('{}', name);
}

/**
 * 检查是否是Windows系统
 * @returns {boolean} 是否是Windows
 */
export function isWin() {
    return process.platform === 'win32';
}

/**
 * 检查是否是Mac系统
 * @returns {boolean} 是否是Mac
 */
export function isMac() {
    return process.platform === 'darwin';
}

/**
 * 检查是否是Unix/Linux系统
 * @returns {boolean} 是否是Unix/Linux
 */
export function isUnx() {
    return process.platform === 'linux';
}

/**
 * 检查是否是英文输入状态
 * @returns {Promise<boolean>} 是否是英文输入
 */
export async function isEnType() {
    try {
        const en = await _get_gray_negative(get_icon('en.png'));
        const en_sg = await _get_gray_negative(get_icon('en_sg.png'));
        const en_home = await _get_gray_negative(get_icon('en_home.png'));
        
        const taskBar = await _get_gray_negative(await scissors.cutReact(get_task_bar_pos()));
        
        return (
            await scaner.hasUniqueTarget(taskBar, en) ||
            await scaner.hasUniqueTarget(taskBar, en_sg) ||
            await scaner.hasUniqueTarget(taskBar, en_home)
        );
    } catch (error) {
        console.error(`检查英文输入状态错误: ${error.message}`);
        return false;
    }
}

/**
 * 检查是否是中文输入状态
 * @returns {Promise<boolean>} 是否是中文输入
 */
export async function isCnType() {
    try {
        const cn = await _get_gray_negative(get_icon('cn.png'));
        const cn_sg = await _get_gray_negative(get_icon('cn_sg.png'));
        const cn_home = await _get_gray_negative(get_icon('cn_home.png'));
        
        const taskBar = await _get_gray_negative(await scissors.cutReact(get_task_bar_pos()));
        
        return (
            await scaner.hasUniqueTarget(taskBar, cn) ||
            await scaner.hasUniqueTarget(taskBar, cn_sg) ||
            await scaner.hasUniqueTarget(taskBar, cn_home)
        );
    } catch (error) {
        console.error(`检查中文输入状态错误: ${error.message}`);
        return false;
    }
}

/**
 * 获取灰度负片
 * @private
 * @param {string} img - 图像路径
 * @returns {Promise<Object>} 处理后的图像
 */
async function _get_gray_negative(img) {
    const grayImg = await scaner.toGray(img);
    return await scaner.toNegative(grayImg);
}

/**
 * 获取系统语言
 * @returns {Promise<string>} 语言代码 'en' 或 'cn'
 */
export async function get_sys_language() {
    if (await isEnType()) {
        return 'en';
    }
    if (await isCnType()) {
        return 'cn';
    }
    return null;
}

/**
 * 获取任务栏位置
 * @returns {Array} 任务栏区域 [x1, y1, x2, y2]
 */
function get_task_bar_pos() {
    const screenSize = robot.getScreenSize();
    // 简化实现，假设任务栏在底部，高度为40
    return [0, screenSize.height - 40, screenSize.width, screenSize.height];
}