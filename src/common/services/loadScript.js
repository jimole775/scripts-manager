// 运行时状态下，只能获取打包后(/out路径下)的脚本地址
import { resolve } from 'path'
export default (scriptName) => {
  return resolve(__dirname, `../scripts/${scriptName}.js`)
}
