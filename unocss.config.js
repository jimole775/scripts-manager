// uno.config.ts
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  theme: {
    colors: {},
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
    presetWebFonts({
      fonts: {},
    }),
  ],
  rules: [
    [/^c((\d|[a-fA-F])+)$/, ([, d]) => ({ color: `#${d}` })], //支持在class属性外使用字体颜色类： <div c000000></div>
    [/^bg((\d|[a-fA-F])+)$/, ([, d]) => ({ background: `#${d}` })], //支持在class属性外使用背景颜色类： <div bg666></div>
    ['w-available', { width: '-webkit-fill-available' }], //宽度自适应
    [/^dot(\d+)$/, ([, d]) => ({ width: `${d}px`, height: `${d}px`, 'border-radius': `${d}px` })], // 圆点
    ['shadow', { 'box-shadow': '0 0.5px 1px -1px #00000029, 0 1.5px 3px 0 #0000001f, 0 2.5px 6px 2px #00000017;' }], // 阴影
    [
      /^line(\d+)$/,
      ([, d]) => ({
        overflow: 'hidden',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': `${d}`,
        'line-clamp': `${d}`,
      }),
    ], // 超过n行换行
  ],
  shortcuts: [
    {
      // flex布局
      'flex-col': 'flex flex-col', // 垂直flex布局
      'flex-y-center': 'flex items-center',
      'flex-center': 'flex items-center justify-center',
      'flex-between': 'flex items-center justify-between',
      'flex-end': 'flex items-end justify-between',

      // 综合类
      emphasize: 'underline italic c-dark fw-bold', //下划线斜体文字
    },
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
