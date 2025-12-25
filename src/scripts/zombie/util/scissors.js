/**
 * 截图工具
 */
const robot = require('robotjs');
const Jimp = require('jimp');
import { mkdir } from './mkdir.js';
import Scaner from './scaner.js';

// 假设配置
const config = {
    PROJECT: {
        path: '',
        name: 'zombie'
    }
};

const assets_dir = `${config.PROJECT.path}${config.PROJECT.name}\shots`;

class Scissors {
    constructor() {
        mkdir(assets_dir);
        this.scaner = new Scaner();
    }

    /**
     * 裁剪唯一区域并保存
     * @param {Object} screen - 屏幕图像
     * @param {Array} point - 中心点 [x, y]
     * @param {number} timeStamp - 时间戳
     */
    cutUniqueReact(screen, point, timeStamp) {
        // 在Node.js中，我们使用setTimeout代替线程
        setTimeout(() => {
            this._uniqueHandle(screen, point, 1, timeStamp);
        }, 0);
    }

    /**
     * 裁剪指定区域
     * @param {Array} loc - 位置 [x1, y1, x2, y2]
     * @returns {Promise<Object>} 裁剪后的图像
     */
    async cutReact(loc) {
        const scn = await this.cutScreen();
        const [x1, y1, x2, y2] = loc;
        return scn.crop(x1, y1, x2 - x1, y2 - y1);
    }

    /**
     * 截取整个屏幕
     * @returns {Promise<Object>} 屏幕截图
     */
    async cutScreen() {
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
        
        return img;
    }

    /**
     * 裁剪循环区域
     * @private
     * @param {Object} screen - 屏幕图像
     * @param {Array} point - 中心点 [x, y]
     * @param {number} zoom - 缩放倍数
     * @returns {Promise<Object>} 裁剪后的图像
     */
    async _cutReactForLoop(screen, point, zoom = 1) {
        const [x1, y1, x2, y2] = this._countReactSize(screen, point, zoom);
        return screen.crop(x1, y1, x2 - x1, y2 - y1);
    }

    /**
     * 裁剪区域并保存
     * @param {Object} screen - 屏幕图像
     * @param {Array} point - 中心点 [x, y]
     * @param {number} timeStamp - 时间戳
     * @returns {Promise<Object>} this
     */
    async cutReactAndSave(screen, point, timeStamp) {
        const temp = await this._cutReactForLoop(screen, point);
        return await this.save(temp, timeStamp);
    }

    /**
     * 保存图像
     * @param {Object} temp - 图像对象
     * @param {number} stamp - 时间戳
     * @returns {Promise<Object>} this
     */
    async save(temp, stamp) {
        if (!stamp) {
            stamp = Date.now();
        }
        
        const fileName = `${stamp}.jpg`;
        await temp.writeAsync(`${assets_dir}\${fileName}`);
        return this;
    }

    /**
     * 唯一处理
     * @private
     * @param {Object} sv_screen - 屏幕图像
     * @param {Array} point - 中心点 [x, y]
     * @param {number} i - 迭代次数
     * @param {number} timeStamp - 时间戳
     */
    async _uniqueHandle(sv_screen, point, i, timeStamp) {
        const temp = await this._cutReactForLoop(sv_screen, point, i);
        const hasUnique = await this.scaner.hasUniqueTarget(sv_screen, temp);
        
        if (hasUnique || i === 10) {
            await this.save(temp, timeStamp);
        } else {
            // 等待0.5秒后继续
            setTimeout(() => {
                this._uniqueHandle(sv_screen, point, i + 1, timeStamp);
            }, 500);
        }
    }

    /**
     * 计算区域大小
     * @private
     * @param {Object} screen - 屏幕图像
     * @param {Array} point - 中心点 [x, y]
     * @param {number} zoom - 缩放倍数
     * @returns {Array} 区域 [x1, y1, x2, y2]
     */
    _countReactSize(screen, point, zoom) {
        const { width: w, height: h } = screen.bitmap;
        const [x, y] = point;
        
        let x1 = x - zoom * 100;
        let y1 = y - zoom * 100;
        let x2 = x + zoom * 100;
        let y2 = y + zoom * 100;
        
        x1 = x1 > 0 ? x1 : 0;
        y1 = y1 > 0 ? y1 : 0;
        x2 = x2 < w ? x2 : w;
        y2 = y2 < h ? y2 : h;
        
        return [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)];
    }
}

export default Scissors;