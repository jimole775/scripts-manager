/**
 * @ Author: Rongxis
 * @ Create Time: 2025-09-10 11:43:12
 * @ Descrition: 对接所有渲染进程 的 API
 */

// 自动加载所有 api 文件
const modules = import.meta.glob('./*.js', { eager: true })

// 排除当前文件
delete modules['./index.js']

// 导出所有模块
export default modules
