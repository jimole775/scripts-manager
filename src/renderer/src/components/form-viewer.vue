<script>
import { h, reactive, defineComponent } from 'vue'
import { mixinStyleAttribute } from '@ui/utils/style'
import { isNone, isValuable } from '@ui/utils/typeof';
import { clone, cloneDeep,  merge, isFunction, isNumber, isString } from 'lodash'

export default defineComponent({
  props: {
    layout: Object,
    bridge: Object,
    dataSource: { required: true, type: Object },
    formItems: { required: true, type: Array },
    textAlign: { type: String, default: 'middle' }, // 'left' | 'rigth' | 'middle'
    emptyText: { type: String, default: '暂未填写数据' },
  },
  computed: {
    isFormViewEmpty () {
      if(isNone(this.dataSource)) return false
      return !this.$props.formItems?.find(i => isValuable(this.dataSource[i.key]))
    }
  },
  watch: {
    dataSource: {
      async handler(val) {
        if (!val) return false
        // 克隆一下 dataSource，防止在 wrapperRender|labelRender 函数中修改 dataSource，造成死循环
        const dataSource = cloneDeep(val)
        const bridge = this.$props.bridge || {}
        // 筛选掉 不显示 的
        const formItems = this.$props?.formItems?.filter((i) => !i.showOn || i.showOn(dataSource, i, bridge))

        // 罗列 vnode 的计算逻辑，支持异步渲染
        const waitLiveFormItems = formItems?.map(async (formItem, index) => {
          const { labelRender, wrapperRender, key, label } = formItem

          // 计算出 默认 的布局
          const layout = this.evalLayout(dataSource, formItem, bridge)
          // 根据 布局样式，计算出 默认 的样式
          const colProps = this.evalColProps(layout, formItem.attrs)
          const labelAttrs = this.evalLabelAttrs(layout, formItem.labelAttrs)
          const wrapperAttrs = this.evalWrapperAttrs(layout, formItem.wrapperAttrs)
          // 如果有提供 render 函数，就调用并获取 vnode
          let labelVNode = labelRender ? await labelRender(dataSource, formItem, bridge, h) : null
          let wrapperVNode = wrapperRender ? await wrapperRender(dataSource, formItem, bridge, h) : null

          // 计算显示文本
          const wrapperText = await this.evalText(dataSource, formItem, bridge)
          // 如果只有 '-'，则不显示 提示文本
          const tips = (isString(wrapperText) || isNumber(wrapperText)) && wrapperText !== '-' ? wrapperText : ''

          // html结构
          return <a-col class={['descript-line', this.$props.textAlign]} {...(colProps || {})} key={key}>
            <div className="descript-line-left" {...(labelAttrs || {})}>{labelVNode || label}</div>
            <div className="descript-line-right" title={tips} {...(wrapperAttrs || {})}>{ wrapperVNode || wrapperText }</div>
          </a-col>
        })
        // 获取所有异步结果
        this.instance.liveVNodes = waitLiveFormItems ? await Promise.all(waitLiveFormItems) : []
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    /**
     * 计算弹性大小
     * @param {number|string} size - 需要计算的大小，可以是数字或字符串
     * @returns {string} - 计算后的弹性大小字符串
     */
    evalFlexSize(size) {
      if (isNumber(size)) {
        return `flex-basis: ${(size / 24) * 100}%` // 将数字转换为百分比
      }
      if (isString(size)) {
        return `flex-basis: ${size}` // 返回字符串作为弹性大小
      }
      return '' // 默认返回空字符串
    },

    /**
     * 评估列属性
     * @param {object} layout - 布局对象
     * @param {object} attrs - 属性对象
     * @returns {object} - 计算后的列属性
     */
    evalColProps(layout, attrs) {
      let layoutStyle = {}
      if (isNumber(layout.span)) {
        layoutStyle = { span: layout.span } // 如果是数字，设置span
      }
      if (isString(layout.span)) {
        layoutStyle = { style: `flex-basis: ${layout.span}` } // 如果是字符串，设置flex-basis
      }
      return Object.assign(layoutStyle, attrs) // 合并属性
    },

    /**
     * 评估标签属性
     * @param {object} layout - 布局对象
     * @param {object} attrs - 属性对象
     * @returns {object} - 计算后的标签属性
     */
    evalLabelAttrs(layout, attrs) {
      const flexSize = this.evalFlexSize(layout.label || '') || {} // 计算标签的弹性大小
      const styleAttrs = mixinStyleAttribute(flexSize, attrs?.style || {}) // 合并样式属性
      return {
        ...attrs,
        style: styleAttrs // 返回合并后的属性
      }
    },

    /**
     * 评估包装属性
     * @param {object} layout - 布局对象
     * @param {object} attrs - 属性对象
     * @returns {object} - 计算后的包装属性
     */
    evalWrapperAttrs(layout, attrs) {
      const flexSize = this.evalFlexSize(layout.wrapper || '') || {} // 计算包装的弹性大小
      const styleAttrs = mixinStyleAttribute(flexSize, attrs?.style || {}) // 合并样式属性
      return {
        ...attrs,
        style: styleAttrs // 返回合并后的属性
      }
    },

    /**
     * 评估布局
     * @param {object} dataSource - 数据源对象
     * @param {object} formItem - 表单项对象
     * @param {object} bridge - 桥接对象
     * @returns {object} - 评估后的布局对象
     */
    evalLayout(dataSource, formItem, bridge) {
      const defaultLayout = { span: 8, label: 8, wrapper: 16 } // 默认布局
      const propsLayout = this.$props?.layout || {} // 获取传入的布局
      const formItemLayout = isFunction(formItem.layout) ? formItem.layout(dataSource, formItem, bridge) : formItem.layout // 评估表单项布局
      const usedLayout = isNone(formItemLayout) ? merge(clone(defaultLayout), propsLayout) : merge(clone(defaultLayout), formItemLayout) // 合并布局
      return usedLayout // 返回使用的布局
    },

    /**
     * 评估文本
     * @param {object} dataSource - 数据源对象
     * @param {object} formItem - 表单项对象
     * @param {object} bridge - 桥接对象
     * @returns {Promise<string>} - 评估后的文本
     */
    async evalText (dataSource, formItem, bridge) {
      const { filter, key, vkey, suffix, prefix } = formItem // 解构表单项
      const suffixContent = isFunction(suffix) ? suffix(dataSource, formItem, bridge) : suffix || '' // 计算后缀内容
      const prefixContent = isFunction(prefix) ? prefix(dataSource, formItem, bridge) : prefix || '' // 计算前缀内容
      const filterRes = filter && await filter(dataSource, formItem, bridge) || '' // 计算过滤结果
      const mainValue = isString(dataSource[vkey || key]) || isNumber(dataSource[vkey || key]) ? dataSource[vkey || key] : '' // 获取主要值
      const dataRes = isValuable(mainValue) ? `${prefixContent || ''}${mainValue || ''}${suffixContent || ''}` : '-' // 组合最终结果
      return isValuable(filterRes) ? filterRes : dataRes // 返回过滤结果或最终结果
    }
  },
  setup(props) {
    const instance = reactive({
      liveVNodes: []
    })
    return { instance }
  },
  render () {
    return <div className="form-viewer">
      {
        this.isFormViewEmpty ? <empty-status description={this.$props.emptyText} /> : <a-row type="flex">
          {this.instance.liveVNodes}
        </a-row>
      }
    </div>
  }
})
</script>
<style lang="less" scoped>
.form-viewer {
  :deep(.descript-line) {
    display: flex;
    align-items: center;
    margin: 8px 0;
    .descript-line-left {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      padding-right: 1rem;
    }

    .descript-line-right {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  :deep(.middle) {
    .descript-line-left {
      min-width: calc(1rem * 6 + 12px);
      text-align: right;
    }

    .descript-line-right {
      text-align: left;
    }
  }
  :deep(.left) {
    .descript-line-left {
      text-align: left;
      flex-basis: unset !important;
    }

    .descript-line-right {
      text-align: left;
      flex-basis: unset !important;
    }
  }
  :deep(.right) {
    .descript-line-left {
      text-align: right;
    }

    .descript-line-right {
      text-align: right;
    }
  }
}
</style>
