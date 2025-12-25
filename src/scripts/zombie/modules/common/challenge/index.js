/**
 * 入参是一个位图，在这个位图中适配 challenge.png 的位置，然后返回坐标
 * 位图要求为 Jimp 实例（包含 `bitmap`、`getPixelColor` 等方法）
 */
const path = require('path');
const JimpNS = require('jimp');
const Jimp = JimpNS.Jimp || JimpNS;

/**
 * 匹配 challenge.png 并返回中心点坐标
 * @param {Jimp} sourceBitmap - 源位图（Jimp 实例）
 * @returns {Promise<[number, number] | null>} [x, y] 或 null
 */
async function locateChallenge(sourceBitmap) {
  if (!sourceBitmap || !sourceBitmap.bitmap || typeof sourceBitmap.getPixelColor !== 'function') {
    throw new Error('locateChallenge 需要传入 Jimp 位图实例');
  }

  const templatePath = path.join(__dirname, 'challenge.png');
  let template;
  try {
    template = await Jimp.read(templatePath);
  } catch (err) {
    throw new Error(`未找到模板图片: ${templatePath}`);
  }

  const pos = await matchTemplate(sourceBitmap, template);
  if (!pos) return null;

  const centerX = pos.x + Math.floor(template.bitmap.width / 2);
  const centerY = pos.y + Math.floor(template.bitmap.height / 2);
  return [centerX, centerY];
}

/**
 * 简化的模板匹配：对模板进行采样像素比较，寻找最高相似度位置
 * @param {Jimp} source
 * @param {Jimp} template
 * @returns {Promise<{x:number,y:number}|null>}
 */
async function matchTemplate(source, template) {
  const { width: sw, height: sh } = source.bitmap;
  const { width: tw, height: th } = template.bitmap;

  if (tw > sw || th > sh) return null;

  let best = { percent: 1, x: 0, y: 0 };

  const similar = (c1, c2) => {
    const a = { a: (c1 >>> 24) & 0xff, r: (c1 >>> 16) & 0xff, g: (c1 >>> 8) & 0xff, b: c1 & 0xff };
    const b = { a: (c2 >>> 24) & 0xff, r: (c2 >>> 16) & 0xff, g: (c2 >>> 8) & 0xff, b: c2 & 0xff };
    const diff = Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) + Math.abs(a.a - b.a);
    return diff <= threshold;
  };

  for (let y = 0; y <= sh - th; y++) {
    for (let x = 0; x <= sw - tw; x++) {
      const patch = source.clone().crop({ x, y, w: tw, h: th });
      const { percent } = JimpNS.diff(patch, template);
      if (percent < best.percent) best = { percent, x, y };
    }
  }

  // 阈值：差异百分比 <= 0.3 认为匹配成功
  if (best.percent <= 0.3) return { x: best.x, y: best.y };
  console.log('matchTemplate best.percent =>', best.percent);
  return null;
}

module.exports = locateChallenge;
