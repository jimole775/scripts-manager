/**
 * 图像扫描工具
 */
const robot = require('robotjs');
const Jimp = require('jimp');

class Scaner {
    constructor() {
        const screenSize = robot.getScreenSize();
        this.win = [0, 0, screenSize.width, screenSize.height];
        this.bbox = [0, 0, 0, 0];
        this.hwnd = null; // 在Node.js中，我们无法直接获取窗口句柄
    }

    /**
     * 查找窗口并截图
     * @param {string} wdname - 窗口名称
     * @returns {Promise<Object>} 截图的Jimp对象
     */
    async findWindow(wdname) {
        // 注意：在Node.js中，我们无法直接获取窗口句柄并置于前台
        // 这里返回整个屏幕的截图作为替代
        console.log(`警告：在Node.js环境中无法查找窗口【${wdname}】，返回全屏截图`);
        
        const screenshot = robot.screen.capture();
        const img = new Jimp(screenshot.width, screenshot.height);
        
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
        
        this.bbox = [0, 0, screenshot.width, screenshot.height];
        return img;
    }

    /**
     * 检查是否有唯一的目标匹配
     * @param {Object|string} screen - 屏幕图像或路径
     * @param {Object|string} temp - 模板图像或路径
     * @returns {Promise<boolean>} 是否有唯一匹配
     */
    async hasUniqueTarget(screen, temp) {
        try {
            const cv_temp = await this.__pl2cv__(temp);
            const cv_screen = await this.__pl2cv__(screen);
            
            // 使用简化的模板匹配
            const matches = await this.findMatches(cv_screen, cv_temp, 0.9);
            return matches.length === 1;
        } catch (error) {
            console.error(`匹配错误: ${error.message}`);
            return false;
        }
    }

    /**
     * 定位模板在源图像中的位置
     * @param {Object|string} origin - 源图像或路径
     * @param {string} tempPath - 模板图像路径
     * @returns {Promise<Array>} [最小位置, 最大位置]
     */
    async locate(origin, tempPath) {
        const cv_origin = await this.__pl2cv__(origin);
        const cv_temp = await this.__pl2cv__(tempPath);
        
        // 使用简化的模板匹配
        const matches = await this.findMatches(cv_origin, cv_temp, 0.8);
        
        if (matches.length > 0) {
            // 返回第一个匹配的位置作为最大位置
            const maxLoc = matches[0];
            // 最小位置简化处理
            const minLoc = [maxLoc[0], maxLoc[1]];
            
            return [minLoc, maxLoc];
        }
        
        return [[0, 0], [0, 0]];
    }

    /**
     * 转换图像格式
     * @private
     * @param {Object|string} img - 图像对象或路径
     * @returns {Promise<Object>} Jimp图像对象
     */
    async __pl2cv__(img) {
        if (typeof img === 'string') {
            return await Jimp.read(img);
        }
        return img; // 假设已经是Jimp对象
    }

    /**
     * 将图像转为灰度
     * @param {Object|string} img - 图像对象或路径
     * @returns {Promise<Object>} 灰度图像
     */
    async toGray(img) {
        const cv_img = await this.__pl2cv__(img);
        return cv_img.grayscale();
    }

    /**
     * 将图像转为负片
     * @param {Object|string} img - 图像对象或路径
     * @returns {Promise<Object>} 负片图像
     */
    async toNegative(img) {
        const cv_img = await this.__pl2cv__(img);
        return cv_img.invert();
    }

    /**
     * 查找所有匹配项
     * @private
     * @param {Object} source - 源图像
     * @param {Object} template - 模板图像
     * @param {number} threshold - 阈值
     * @returns {Promise<Array>} 匹配位置数组
     */
    async findMatches(source, template, threshold) {
        const matches = [];
        const { width: sourceWidth, height: sourceHeight } = source.bitmap;
        const { width: templateWidth, height: templateHeight } = template.bitmap;
        
        // 简化的模板匹配
        for (let y = 0; y <= sourceHeight - templateHeight; y += 10) { // 步长10提高性能
            for (let x = 0; x <= sourceWidth - templateWidth; x += 10) {
                const similarity = await this.calculateSimilarity(
                    source, template, x, y
                );
                
                if (similarity >= threshold) {
                    matches.push([x, y]);
                }
            }
        }
        
        return matches;
    }

    /**
     * 计算两个图像区域的相似度
     * @private
     * @param {Object} source - 源图像
     * @param {Object} template - 模板图像
     * @param {number} x - 起始x坐标
     * @param {number} y - 起始y坐标
     * @returns {Promise<number>} 相似度(0-1)
     */
    async calculateSimilarity(source, template, x, y) {
        let matchCount = 0;
        let totalPixels = 0;
        
        const { width: templateWidth, height: templateHeight } = template.bitmap;
        
        for (let ty = 0; ty < templateHeight; ty += 5) { // 采样以提高性能
            for (let tx = 0; tx < templateWidth; tx += 5) {
                try {
                    const sourceColor = source.getPixelColor(x + tx, y + ty);
                    const templateColor = template.getPixelColor(tx, ty);
                    
                    // 简化的颜色比较
                    if (this.colorDistance(sourceColor, templateColor) < 5000) {
                        matchCount++;
                    }
                    totalPixels++;
                } catch (e) {
                    // 忽略边界错误
                }
            }
        }
        
        return totalPixels > 0 ? matchCount / totalPixels : 0;
    }

    /**
     * 计算两个颜色的距离
     * @private
     * @param {number} color1 - 颜色1
     * @param {number} color2 - 颜色2
     * @returns {number} 颜色距离
     */
    colorDistance(color1, color2) {
        const r1 = (color1 >> 24) & 255;
        const g1 = (color1 >> 16) & 255;
        const b1 = (color1 >> 8) & 255;
        
        const r2 = (color2 >> 24) & 255;
        const g2 = (color2 >> 16) & 255;
        const b2 = (color2 >> 8) & 255;
        
        return Math.sqrt(
            Math.pow(r1 - r2, 2) +
            Math.pow(g1 - g2, 2) +
            Math.pow(b1 - b2, 2)
        );
    }
}

export default Scaner;