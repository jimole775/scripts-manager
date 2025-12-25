/**
 * 图像匹配工具
 */
const robot = require('robotjs'); // 需要安装: npm install robotjs
const Jimp = require('jimp'); // 需要安装: npm install jimp

/**
 * 在屏幕上匹配指定图片并返回中心点坐标
 * @param {string} imgSrc - 要匹配的图片路径
 * @returns {Array|null} 匹配到的图片中心坐标 [x, y]，未匹配到则返回null
 */
export async function get_point(imgSrc) {
    try {
        // 截取当前屏幕
        const screenshot = robot.screen.capture();
        const img = new Jimp(screenshot.width, screenshot.height);
        
        // 将截图数据转换为Jimp图像
        for (let y = 0; y < screenshot.height; y++) {
            for (let x = 0; x < screenshot.width; x++) {
                const index = (y * screenshot.width + x) * 4;
                const r = screenshot.image[index];
                const g = screenshot.image[index + 1];
                const b = screenshot.image[index + 2];
                const color = Jimp.rgbaToInt(r, g, b, 255);
                img.setPixelColor(color, x, y);
            }
        }
        
        // 读取模板图片
        const template = await Jimp.read(imgSrc);
        
        // 使用Jimp的查找功能（这是一个简化版，实际可能需要更复杂的图像匹配算法）
        // 注意：Jimp没有内置的模板匹配，这里使用一个简化的实现
        // 实际项目中可能需要使用更专业的图像处理库
        const result = await matchTemplate(img, template);
        
        if (result) {
            const { x, y } = result;
            const centerX = x + Math.floor(template.bitmap.width / 2);
            const centerY = y + Math.floor(template.bitmap.height / 2);
            return [centerX, centerY];
        }
        
        return null;
    } catch (error) {
        console.error(`图像匹配错误: ${error.message}`);
        return null;
    }
}

/**
 * 简化的模板匹配实现
 * @private
 * @param {Object} source - 源图像(Jimp对象)
 * @param {Object} template - 模板图像(Jimp对象)
 * @returns {Object|null} 匹配位置 {x, y} 或 null
 */
async function matchTemplate(source, template) {
    const threshold = 0.8;
    const { width: sourceWidth, height: sourceHeight } = source.bitmap;
    const { width: templateWidth, height: templateHeight } = template.bitmap;
    
    // 遍历源图像中可能的模板位置
    for (let y = 0; y <= sourceHeight - templateHeight; y++) {
        for (let x = 0; x <= sourceWidth - templateWidth; x++) {
            // 计算相似度
            let matchCount = 0;
            let totalPixels = 0;
            
            // 简化的像素比较
            for (let ty = 0; ty < templateHeight; ty += 5) { // 每隔5个像素采样以提高性能
                for (let tx = 0; tx < templateWidth; tx += 5) {
                    const sourceColor = source.getPixelColor(x + tx, y + ty);
                    const templateColor = template.getPixelColor(tx, ty);
                    
                    // 简化的颜色比较
                    if (Math.abs(sourceColor - templateColor) < 10000) { // 容差值
                        matchCount++;
                    }
                    totalPixels++;
                }
            }
            
            const similarity = matchCount / totalPixels;
            console.log(`匹配相似度: ${similarity}`);
            
            if (similarity >= threshold) {
                return { x, y };
            }
        }
    }
    
    return null;
}