<!--
  // todo formItems 以字面量形式赋值时，会导致 show 等类似的属性，无法动态赋值到 formItem 描述项上
  // todo 大量取值 和 渲染 的动作，有望做缓存优化
  // todo 把当前实例的暴露方法 全部绑定到 bridge 这个参数上面
  // todo 支持 tsx 语法配置
  // todo 支持 异步 formItem 配置
  // todo 支持 keep-alive, 从 vue2 源码中借鉴逻辑
  // todo data-source 和 value 只留一个
  // todo 提供插槽，支持模板语法
  // todo 使用 component 属性时, 会导致输入框失焦
  // todo 变更 formItems 属性为响应式???
  // todo 需要区分 自动渲染 的字段 和 手动渲染 的字段，比如一些依赖接口获取数据的 组件
 -->
<script lang="jsx">
import { h, ref, reactive, defineComponent, Fragment } from 'vue'
import { isFunction, clone, cloneDeep, isArray, isNumber, isObject, isString, merge, eq } from 'lodash'
import { theme, Form, Row, Col, Tooltip } from 'ant-design-vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import * as antd from 'ant-design-vue'
import { isNone, isValuable } from '@ui/utils/typeof';

// 表单数据存储对象
let formDataStore = {}
// 表单阶段存储对象
let formStageStore = {}
// 创建一个空对象的函数
const createMap = () => Object.create(null)
// 布局配置：8列布局
const layout8 = {
  span: 8, // 列跨度
  label: 9, // 标签占用的列数
  wrapper: 15 // 内容占用的列数
}
// 布局配置：6列布局
const layout6 = {
  span: 6, // 列跨度
  label: 10, // 标签占用的列数
  wrapper: 14 // 内容占用的列数
}
// 创建一个响应式的 store，用于存储表单模型、缓存模型和表单项
const store = ref({})

function dash2camel (str = '') {
  return str
  .split('-') // 将字符串按 '-' 分割成数组
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // 将每个单词的首字母大写
  .join(''); // 将数组重新连接成字符串
}

export default defineComponent({
  name: 'FormEditor',
  emits: ['change'],
  props: {
    formItems: {
      required: true,
      type: Array
    },
    mode: 'readonly', // 'edit' | 'readonly'
    rules: Array, // 统一默认的校验规则
    dataSource: Object, // 默认的表单数据
    modelValue: Object, // 保留 modelValue 入参，但是不支持双向绑定，避免死循环
    bridge: Object, // 主要用于支持跨作用域调用方法
    layout: Object, // 全局默认的 布局
    queryEmptyFields: Object, // 是否默认隐藏空值的字段
    validator: Function, // 额外增加的校验逻辑
    disabled: Boolean, // 是否禁用
    keepAlive: Boolean, // 是否保持活跃状态
  },
  watch: {
    // 兼容 dataSource 入参，使和 FormViewer 的语义靠近
    dataSource: {
      handler(defValue) {
        // 如果 defValue 不存在，直接返回 false
        if (!defValue) return false
        // 获取实例中的 formItemMap 和 formModel
        const { formItemMap, formModel } = this.instance
        // 遍历 formModel 中的每一个属性
        Object.entries(formModel || {}).forEach(async ([key, val]) => {
          // 获取当前属性的值，如果 defValue 中有对应的值，就使用 defValue 中的值，否则使用 val
          const inputValue = defValue && defValue.hasOwnProperty(key) ? defValue[key] : val
          // 获取当前属性对应的 formItem
          const formItem = formItemMap?.[key]
          // 如果 formItem 的 default 是一个函数，就调用这个函数
          if (isFunction(formItem?.default)) {
            formModel[key] = await formItem.default(defValue || {}, formItem, this.mixinBridge())
          } else {
            // 否则直接使用 formItem 的 default 或者 inputValue
            formModel[key] = formItem?.default || inputValue
          }
        })
      },
      immediate: true
    },
    value: {
      // 处理 value 的变化
      handler(defValue) {
        // 如果 defValue 不存在，直接返回
        if (!defValue) return false
        // 获取 formItemMap 和 formModel
        const { formItemMap, formModel } = this.instance
        // 遍历 formModel 的每一个属性
        Object.entries(formModel || {}).forEach(async ([key, val]) => {
          // 获取当前属性的值，如果 defValue 中有对应的值，就使用 defValue 中的值，否则使用 formModel 中的值
          const inputValue = defValue && defValue.hasOwnProperty(key) ? defValue[key] : val
          // 获取当前属性对应的 formItem
          const formItem = formItemMap?.[key]
          // 如果 formItem 的 default 是一个函数，就调用这个函数，否则直接使用 formItem 的 default 或者 inputValue
          if (isFunction(formItem?.default)) {
            formModel[key] = await formItem.default(defValue || {}, formItem, this.mixinBridge())
          } else {
            formModel[key] = formItem?.default || inputValue
          }
        })
      },
      immediate: true
    },
    modelValue: {
      handler(model) {
        // 如果当前的 formModel 和传入的 model 相等，则直接返回
        if (eq(this.instance.formModel, model)) return false
        // 获取当前实例的 formItemMap 和 formModel
        const { formItemMap, formModel } = this.instance
        // 遍历 formModel 中的每一个属性
        Object.entries(formModel || {}).forEach(([key, val]) => {
          // 获取当前属性的值，如果 model 中有对应的值，则使用 model 中的值，否则使用 formModel 中的值
          const inputValue = model && model.hasOwnProperty(key) ? model[key] : val
          // 获取当前属性对应的 formItem
          const formItem = formItemMap?.[key]
          // 如果 formItem 有 inputTransform 方法，则调用这个方法，否则直接使用 inputValue
          if (formItem?.inputTransform) {
            formModel[key] = formItem.inputTransform(formModel, formItem, this.mixinBridge())
          } else {
            formModel[key] = inputValue
          }
        })
      },
      immediate: true
    },
    'instance.formModel': {
      handler(model) {
        // 如果当前的 modelValue 和传入的 model 相等，则直接返回
        if (eq(this.$props.modelValue, model)) return false
        // 等待下一个 DOM 更新周期
        this.$nextTick(() => {
          // 触发 change 事件，传递克隆的 model
          this.$emit('change', cloneDeep(model || {}))
          // 更新 modelValue，传递克隆的 model
          // this.$emit('update:modelValue', cloneDeep(model || {}))
        })
      },
      deep: true
    }
  },
  methods: {
    /**
     * 获取实时表单项
     * @returns {Array} 深拷贝的表单项数组
     */
    getLiveFormItems() {
      return cloneDeep(this.$props?.formItems || [])
        .filter(item => this.isCanShow(item))
    },
    /**
     * 评估表单项符号
     * @param {Object} formItem - 表单项
     * @returns {string} 表单项的键
     */
    evalFormItemSymbol(formItem) {
      return formItem.key || ''
    },
    /**
     * 评估Antd组件
     * @param {any} symbol - 组件符号
     * @returns {any} 对应的Antd组件
     */
    evalAntdComponent(symbol) {
      // 如果symbol是字符串
      if (isString(symbol)) {
        // 将symbol转换为驼峰命名
        const name = dash2camel(symbol.replace(/^a-/, '-'))
        // 返回对应的Antd组件
        return antd[name]
      } else {
        // 如果symbol不是字符串，则直接返回symbol
        return symbol
      }
    },
    /**
     * 渲染标签
     * @param {Object} formItem - 表单项
     * @returns {VNode | undefined} 标签节点
     */
    labelRender(formItem) {
      // 获取表单项的符号
      const symbol = this.evalFormItemSymbol(formItem)
      // 深拷贝当前实例的表单模型
      const onlyData = cloneDeep(this.instance.formModel)
      // 创建桥接对象
      const bridge = this.mixinBridge()
      // 初始化标签节点
      let labelNode
      // 如果已经缓存了标签节点，则直接返回
      if (this.instance.formItemNodeMap[symbol]?.label) return this.instance.formItemNodeMap[symbol].label
      // 如果没有缓存标签节点，则初始化一个空的Map
      if (!this.instance.formItemNodeMap[symbol]) this.instance.formItemNodeMap[symbol] = createMap()
      // 如果表单项有标签属性
      if (formItem.hasOwnProperty('label')) {
        // 初始化子节点数组
        const children = [h('span', formItem.label)]
        // 如果表单项有描述属性，则添加一个提示气泡
        if (formItem.description) {
          children.push(
            h(Tooltip,
              { title: formItem.description },
              {
                default: () => h(QuestionCircleOutlined, { style: 'margin-left: 5px;' })
              }
            )
          )
        }
        // span 标签节点
        labelNode = h('span', { class: 'label' }, { default : () => children })
      }
      // 如果表单项有自定义标签渲染函数
      if (formItem.hasOwnProperty('labelRender')) {
        // 调用自定义渲染函数
        labelNode = formItem.labelRender?.(onlyData, formItem, bridge, h)
      }
      // 如果生成了标签节点，则缓存它
      if (labelNode) {
        this.instance.formItemNodeMap[symbol].label = labelNode
      }
      // 返回标签节点
      return labelNode
    },
    /**
     * 渲染表单项的包装节点
     * @param {Object} formItem - 表单项
     * @param {Object} bridge - 桥接对象
     * @returns {VNode | undefined} 包装节点
     */
    wrapperRender(formItem, bridge) {
      let wrapperNode
      const symbol = this.evalFormItemSymbol(formItem) // 评估表单项的符号
      // todo 需要判断 value 是否变更，showOnFields 是否变更，才是否需要重新渲染
      // todo change 事件，也需要判断是否数据有变更，才决定是否重新赋值
      // const onlyData = cloneDeep(this.instance.formModel) // 深拷贝当前表单模型
      // if (this.instance.formItemNodeMap[symbol]?.wrapper && this.isDataChange(formItem)) {
      // const cacheComponent = this.instance.formItemNodeMap[symbol].wrapper
      // console.log(this.instance.formModel[formItem.key] || undefined) // 输出当前表单项的值
      // cacheComponent.el.value = this.instance.formModel[formItem.key] // 更新缓存组件的值
      // cacheComponent?.props.value = this.instance.formModel[formItem.key] // 更新缓存组件的props值
      // cacheComponent.component.ctx.value = this.instance.formModel[formItem.key] // 更新组件上下文的值
      // cacheComponent.ctx.update() {
      // return cacheComponent
      // }
      if (!this.instance.formItemNodeMap[symbol]) this.instance.formItemNodeMap[symbol] = createMap() // 初始化表单项节点映射
      if (formItem.wrapperRender) {
        if (isFunction(formItem.wrapperRender)) {
          // todo 可以改造 h 函数，让其支持 h('a-input') 这样的写法
          return formItem.wrapperRender(this.instance.formModel, formItem, bridge, h) // 调用自定义的包装渲染函数
        } else {
          return new Error('wrapperRender must be a function') // 报错提示：wrapperRender必须是一个函数
        }
      } else if (formItem.component && formItem.mode === 'edit') {
        // todo 进一步研究 component 和 wrapperRender 字段的效果影响，主要就是视图刷新会闪屏的问题  
        const props = isFunction(formItem.props) ? formItem.props(this.instance.formModel, formItem, bridge) : formItem.props // 获取表单项的props
        const events = this.evalEvents(this.instance.formModel, formItem, bridge) // 评估事件
        const component = this.evalAntdComponent(formItem.component) // 评估Ant Design组件
        const builderProps = {
          disabled: formItem.disabled, // disabled 可以写在 formItem 上面，也可以写 props 里面， props 有覆盖优先级
          ...(props || {}), // 合并props
          ...(events || {}), // 合并事件
          key: formItem.key, // 设置组件的key
          value: this.instance.formModel[formItem.key] || undefined, // input 类型的数据绑定
          checked: this.instance.formModel[formItem.key], // 兼容 a-checkbox 的默认赋值参数
          modelValue: this.instance.formModel[formItem.key] || undefined, // 兼容 v-model 类型的数据绑定
          onChange: (ev) => {
            const value = ev?.target ? ev.target.value : ev // 获取当前值
            this.instance.formModel[formItem.key] = formItem.inputTransform ? formItem.inputTransform(value, formItem, bridge) : value // 更新表单模型的值
            // 根据配置的关联回调，执行后，直接赋值
            if (formItem.updateOn) {
              Object.keys(formItem.updateOn).forEach(async (formKey) => {
                // 获取目标表单模型
                const targetFormModel = this.getFormModel(formKey)
                // 获取目标表单项
                const targetFormItem = this.getFormItem(formKey)
                // 获取关联效应
                const updateOn = formItem.updateOn[formKey]
                // 如果关联效应是一个函数，则执行它
                if (isFunction(updateOn)) {
                   // 执行关联效应
                   updateOn(this.instance.formModel, formItem, targetFormModel, targetFormItem)
                } else {
                  // 否则直接赋值
                  targetFormModel[formKey] = updateOn
                }
              })
            }
            // 如果存在onChange事件，则执行
            if (events.onChange) {
              // 传递参数：当前值，表单模型，表单项，桥接
              events.onChange(value, this.instance.formModel, formItem, bridge) // 执行onChange事件
            }
          }
        }

        // 使用h函数创建组件节点
        wrapperNode = h(component, this.evalCustomComponentProps(builderProps, component, formItem, bridge)) // 创建组件节点
      }

      // 如果wrapperNode存在，将其赋值给formItemNodeMap的wrapper属性
      if (wrapperNode) {
        this.instance.formItemNodeMap[symbol].wrapper = wrapperNode // 缓存wrapperNode
      }
      return wrapperNode // 返回包装节点
    },
    /**
     * 评估自定义组件的属性并返回构建的属性对象
     * @param {any} builderProps - 构建属性
     * @param {any} component - 组件
     * @param {Object} formItem - 表单项
     * @param {any} bridge - 桥接对象
     * @returns {[Object, Object]} 构建的属性对象
     */
    evalCustomComponentProps (builderProps, component, formItem, bridge) {
      // 解构组件的emits和props，默认值为空数组和空对象
      const { emits = [], props = {} } = component || {}
      // todo 暂时先不绑定 modelValue，因为未测试是不是有性能问题
      // 遍历props对象，过滤掉'modelValue'键
      Object.keys(props).filter(i => i !== 'modelValue').forEach((key) => {
        // 如果emits数组中包含以'update:'开头的键，则执行以下操作
        if (emits.includes(`update:${key}`)) {
          // 将当前键的值设置为formModel中对应键的值，如果不存在则设置为undefined
          builderProps[key] = this.instance.formModel[formItem.key] || undefined
          // 定义一个更新事件处理函数
          builderProps[`onUpdate:${key}`] = (ev) => {
            // 获取事件的值，如果是input事件，则获取目标的值
            const value = ev?.target ? ev.target.value : ev
            // 如果formItem有inputTransform方法，则使用该方法转换值，否则直接使用值
            this.instance.formModel[formItem.key] = formItem.inputTransform ? formItem.inputTransform(value, formItem, bridge) : value
          }
          // 如果自定义组件有自己的更新逻辑，则不执行默认赋值操作，避免数据类型不准确导致的各种BUG
          delete builderProps.onChange
        }
      })
      // 返回构建好的属性对象
      return builderProps
    },
    /**
     * 评估事件并创建事件映射
     * @param {Object} onlyData - 表单模型
     * @param {Object} formItem - 表单项
     * @param {Object} bridge - 桥接对象
     * @returns {Object} 事件映射对象
     */
    evalEvents(onlyData, formItem, bridge) {
      const eventmap = createMap()
      // 查找出符合 onXxxx 结构的属性，如果它的值是函数，则它就是一个需要绑定的事件
      Object.entries(formItem).forEach(([key, val]) => {
        if (/^on[A-Z]\w*/.test(key) && isFunction(val)) {
          const eventName = key
          const fn = val
          eventmap[eventName] = (...args) => {
            fn(...args, onlyData, formItem, bridge)
          }
        }
      })
      return eventmap
    },
    /**
     * 检查表单项是否可以显示
     * @param {Object} formItem - 表单项
     * @returns {boolean} 是否可以显示
     */
    isCanShow(formItem) {
      // 初始化显示状态
      let show = formItem.show
      const values = cloneDeep(this.instance.formModel) // 深拷贝表单模型
      const bridge = this.mixinBridge() // 获取桥接对象
      // 检查是否有隐藏字段的条件
      if (formItem.hideOnField) {
        let iHide = false
        Object.entries(formItem.hideOnField) // 遍历隐藏字段条件
          .forEach(([k, v]) => {
            if (isNone(v)) return // 如果值为null或undefined，跳过
            if (!isArray(v)) v = [v] // 确保值为数组
            if (v.includes(values[k])) iHide = true // 如果当前值在隐藏条件中，设置为隐藏
            // todo 需要判断 values[k] 的类型，比如数组，对象，字符串
          })
        show = !iHide // 根据隐藏条件更新显示状态
      }
      // 检查是否有显示字段的条件
      if (formItem.showOnField) {
        let iShow = false
        Object.entries(formItem.showOnField) // 遍历显示字段条件
          .forEach(([k, v]) => {
            if (isNone(v)) return // 如果值为null或undefined，跳过
            if (!isArray(v)) v = [v] // 确保值为数组
            if (v.includes(values[k])) iShow = true // 如果当前值在显示条件中，设置为显示
            // todo 需要判断 values[k] 的类型，比如数组，对象，字符串
          })
        show = iShow // 根据显示条件更新显示状态
      }
      // 如果有自定义的显示逻辑
      if (formItem.showOn && isFunction(formItem.showOn)) {
        show = !!formItem.showOn(values, formItem, bridge) // 调用自定义显示逻辑
      }
      // 只读逻辑
      if (formItem.mode === 'readonly' && this.$props?.queryEmptyFields?.includes(formItem.key)) {
        show = !!isValuable(values[formItem.key]) // 检查只读模式下的值是否有价值
      }
      return show // 返回最终的显示状态
    },
    /**
     * 渲染编辑项
     * @param {Object} formItem - 表单项
     * @param {Object} usedLayout - 布局
     * @returns {VNode} 编辑项节点
     */
    editItemRender(formItem, usedLayout) {
      const bridge = this.mixinBridge()
      // 获取表单项的属性
      const props = isFunction(formItem.props) ? formItem.props(this.instance.formModel, formItem, bridge) : formItem.props || {}
      // 判断该表单项是否为必填项
      const required = isFunction(formItem.required) ? formItem.required(this.instance.formModel, formItem, bridge) : formItem.required
      // 默认校验规则
      const defaultRule = [{ required: required, message: isArray(props.placeholder) ? props.placeholder.join(', ') : props.placeholder, trigger: ['blur', 'change'] }]
      // 自定义校验规则
      const customRules = isFunction(formItem.rules) ? formItem.rules(this.instance.formModel, formItem, bridge) : formItem.rules
      // 合并校验规则
      const rules = customRules ? defaultRule.concat(customRules) : defaultRule

      // 创建表单项属性对象
      const formItemProps = {
        ...formItem.props,
        ...formItem.attrs,
        rules,
        name: formItem.key,
        required,
        labelCol: { span: usedLayout.label },
        wrapperCol: { span: usedLayout.wrapper },
        label: h(Fragment, null, [this.labelRender(formItem)])
      }

      // 返回表单项
      return h(Form.Item, formItemProps, { default: () => [
        // 渲染表单项的包装和提示
        this.wrapperRender(formItem, bridge),
        this.evalTips(formItem, bridge)
      ]})
    },
    /**
     * 评估提示信息
     * @param {Object} formItem - 表单项
     * @param {Object} bridge - 桥接对象
     * @returns {VNode | string} 提示、警告或错误节点
     */
    evalTips (formItem, bridge) {
      // 获取提示内容
      const tipsContent = formItem.tipRender ? formItem.tipRender(this.instance.formModel, formItem, bridge) : formItem.tip || this.instance.tipsMap[formItem.key].tip
      // 获取警告内容
      const warningContent = formItem.warningRender ? formItem.warningRender(this.instance.formModel, formItem, bridge) : formItem.warning || this.instance.tipsMap[formItem.key].warning
      // 获取错误内容
      const errorContent = formItem.errorRender ? formItem.errorRender(this.instance.formModel, formItem, bridge) : formItem.error || this.instance.tipsMap[formItem.key].error
      // 创建提示节点
      const tipSlot = tipsContent ? h('div', { style: `color: ${this.token.colorTextDescription}` }, tipsContent) : ''
      // 创建警告节点
      const warningSlot = warningContent ? h('div', { style: `color: ${this.token.colorWarning}` }, warningContent) : ''
      // 创建错误节点
      const errorSlot = errorContent ? h('div', { style: `color: ${this.token.colorError}` }, errorContent) : ''
      // 返回提示、警告或错误节点
      return tipSlot || warningSlot || errorSlot ? [tipSlot, warningSlot, errorSlot] : ''
    },
    /**
     * 渲染表单项的列
     * @returns {VNode[]} 列节点数组
     */
    colsRender() {
      const liveFormItems = this.getLiveFormItems()
      const bridge = this.mixinBridge()
      const formModel = cloneDeep(this.instance.formModel)
      return liveFormItems.map(formItem => {
        // 获取自定义布局
        const customLayout = isFunction(formItem.layout) ?
          formItem.layout(formModel, formItem, bridge) :
          formItem.layout
        // 合并布局设置
        const usedLayout = merge(clone(layout8), clone(this.$props.layout), clone(customLayout) || {})
        // todo xxl 的宽度可以根据 span 来适应性填充，不需要外部接口写死
        // <a-col> 列节点
        return h(Col, {
          key: formItem.key || formItem.vkey,
          class: formItem.mode === 'readonly' && 'form-item-readonly',
          span: usedLayout.span
        }, {
          default: () => this.editItemRender(formItem, usedLayout)
        })
      })
    }
  },
  setup (props, ctx) {
    const formRef = ref()
    const { token } = theme.useToken()
    const formModel = {}
    const tipsMap = {}
    const formItemMap = {}
    const symbols = []
    // 给 bridge 拼装一些公共方法
    // if (!props.bridge) props.bridge = {}
    // props.bridge.getValue = getValue
    // props.bridge.getValues = getValues
    // props.bridge.validate = validate
    // props.bridge.getFormItem = getFormItem
    // props.bridge.getFormModel = getFormModel
    // 遍历表单项
    props?.formItems?.forEach((item) => {
      // 格式化表单项
      formatItem(item)
      // 初始化表单模型的值为 undefined
      formModel[item.key] = undefined
      // 将表单项映射到表单项映射表中
      formItemMap[item.key] = item
      // 初始化提示信息映射
      tipsMap[item.key] = {
        tip: '',
        warning: '',
        error: ''
      }
      // 如果表单项有键，则将其添加到符号数组中
      item.key && symbols.push(item.key)
    })

    // 创建一个响应式实例，包含表单的状态、列节点、表单模型、表单项节点映射、提示信息映射和表单项映射
    const instance = reactive({
      colsNodes: [], // 列节点
      formModel: reactive(formModel), // 表单模型
      formItemNodeMap: {}, // 表单项节点映射
      tipsMap, // 提示信息映射
      formItemMap // 通过 key 可以快速访问的表单项映射
    })

    // 把当前表单数据，绑到全局，方便夸表单联动
    store.value[symbols.join('.')] = {
      formModel: instance.formModel,
      cacheModel: cloneDeep(instance.formModel),
      formItems: props?.formItems
    }

    /**
     * 校验
     * @returns {Promise<boolean>} 返回一个新的 Promise
     */
    function validate () {
      // 返回一个新的 Promise
      return new Promise(async (resolve) => {
        // 如果 formRef 不存在，直接返回 true
        if (!formRef.value) return resolve(true)
        // 遍历表单项，进行验证
        const alls = props?.formItems.map(async (item) => {
          // 如果有 validate 方法，则执行验证
          if (item.validate) {
            const isPass = await item.validate(instance.formModel, item)
            return Promise.resolve(isPass) // 返回验证结果
          }
        })
        // 等待所有验证结果
        const itemValidates = await Promise.all(alls)
        // 如果有任何验证不通过，返回 false
        if (itemValidates.includes(false)) return resolve(false)
        // 调用 formRef 的 validate 方法进行验证
        formRef.value.validate().then(() => {
          return resolve(true) // 验证通过，返回 true
        }).catch((err) => {
          return resolve(false) // 验证失败，返回 false
        })
      })
    }

    /**
     * 格式化表单项
     * @param {FormEditor.FormItem} item - 表单项
     * @returns {FormEditor.FormItem} 格式化后的表单项
     */
    function formatItem (item) {
      // 如果未定义显示属性，则默认为 true
      if (item.show === undefined) item['show'] = true
      // 如果未定义必填属性，则默认为 false
      if (item.required === undefined) item['required'] = false
      // 如果未定义禁用属性，则默认为 props.disabled 或 false
      if (item.disabled === undefined) item['disabled'] = props.disabled || false
      // 如果未定义布局，则使用 props.layout
      if (item.layout === undefined) item['layout'] = props.layout
      // 如果未定义模式，则默认为 'edit'
      if (item.mode === undefined) item['mode'] = props.mode || 'edit'
      // 如果未定义注入参数，则默认为空对象
      if (item.injectParam === undefined) item['injectParam'] = {}
      // 如果未定义获取值的方法，则使用 getValue
      if (item.getValue === undefined) item['getValue'] = () => getValue(item.key)
      // 如果未定义设置值的方法，则使用 setValue
      if (item.setValue === undefined) item['setValue'] = (value) => setValue(item.key, value)
      // 如果未定义获取提示的方法，则使用 getTip
      if (item.getTip === undefined) item['getTip'] = () => getTip(item.key)
      // 如果未定义获取错误的方法，则使用 getError
      if (item.getError === undefined) item['getError'] = () => getError(item.key)
      // 如果未定义获取警告的方法，则使用 getWarning
      if (item.getWarning === undefined) item['getWarning'] = () => getWarning(item.key)
      // 如果未定义设置提示的方法，则使用 setTip
      if (item.setTip === undefined) item['setTip'] = (value) => setTip(item.key, value)
      // 如果未定义设置警告的方法，则使用 setWarning
      if (item.setWarning === undefined) item['setWarning'] = (value) => setWarning(item.key, value)
      // 如果未定义设置错误的方法，则使用 setError
      if (item.setError === undefined) item['setError'] = (value) => setError(item.key, value)
      return item
    }

    /**
     * 裁剪掉不显示的字段
     * @param {any} model - 表单模型
     * @param {any} items - 表单项
     * @returns {any} 裁剪后的表单模型
     */
    const cutDeadFields = (model, items) => {
      // 裁剪掉不显示的字段
      return Object.entries(model).reduce((res, [key, value]) => {
        // 检查字段是否在显示的项中
        if (items.find((i) => i.key === key)) res[key] = value
        return res
      }, {})
    }

    /**
     * 获取表单项的错误信息
     * @param {string} key - 表单项的键
     * @returns {string} 表单项的错误信息
     */
    function getError (key) {
      const item = getFormItem(key) // 获取指定键的表单项
      return item.error || instance.tipsMap[key].error // 返回表单项的错误信息或提示映射中的错误信息
    }

    /**
     * 获取表单项的警告信息
     * @param {string} key - 表单项的键
     * @returns {string} 表单项的警告信息
     */
    function getWarning (key) {
      const item = getFormItem(key) // 获取指定键的表单项
      return item.warning || instance.tipsMap[key].warning // 返回表单项的警告信息或提示映射中的警告信息
    }

    /**
     * 获取表单项的提示信息
     * @param {string} key - 表单项的键
     * @returns {string} 表单项的提示信息
     */
    function getTip (key) {
      const item = getFormItem(key) // 获取指定键的表单项
      return item.tip || instance.tipsMap[key].tip // 返回表单项的提示信息或提示映射中的提示信息
    }

    /**
     * 设置表单项的提示信息
     * @param {string} key - 表单项的键
     * @param {string} val - 提示信息
     */
    function setTip (key, val) {
      const item = getFormItem(key) // 获取指定键的表单项
      item.tip = val // 设置表单项的提示信息
      instance.tipsMap[key].tip = val // 更新提示映射中的提示信息
    }

    /**
     * 设置表单项的警告信息
     * @param {string} key - 表单项的键
     * @param {string} val - 警告信息
     */
    function setWarning (key, val) {
      const item = getFormItem(key) // 获取指定键的表单项
      item.warning = val // 设置表单项的警告信息
      instance.tipsMap[key].warning = val // 更新提示映射中的警告信息
    }

    /**
     * 设置表单项的错误信息
     * @param {string} key - 表单项的键
     * @param {string} val - 错误信息
     */
    function setError (key, val) {
      const item = getFormItem(key) // 获取指定键的表单项
      item.error = val // 设置表单项的错误信息
      instance.tipsMap[key].error = val // 更新提示映射中的错误信息
    }

    /**
     * 获取指定字段的值
     * @param {string} field - 字段名
     * @returns {any} 字段的值
     */
    function getValue (field) {
      const targetModel = getFormModel(field) // 获取指定字段的表单模型
      return targetModel[field] // 返回字段的值
    }

    /**
     * 设置指定字段的值
     * @param {string} field - 字段名
     * @param {any} value - 字段的值
     */
    function setValue (field, value) {
      const targetModel = getFormModel(field) // 获取指定字段的表单模型
      targetModel[field] = value // 设置字段的值
    }

    /**
     * 设置所有相同字段的值
     * @param {string} field - 字段名
     * @param {any} value - 字段的值
     */
    function setAllValue (field, value) {
      const targetModels = getAllFormModel(field)
      targetModels.forEach((targetModel) => {
        targetModel[field] = value
      })
    }

    /**
     * 混合桥接对象
     * @returns {object} 混合桥接对象
     */
    function mixinBridge () {
      return {
        validate,
        getValue,
        setValue,
        setAllValue,
        getValues,
        getFormModel,
        getAllFormModel,
        getFormItem,
        setTip,
        setWarning,
        setError,
        dataSource: props.dataSource, // todo dataSource 数据丢失，需要进行修复
        ...props.bridge || {},
      }
    }

    /**
     * 获取表单项的值
     * @returns {Promise<Common.LooseObject>} 表单项的值
     */
    async function getValues () {
      // 过滤出当前活动的表单项
      const liveFormItems = props.formItems.filter(item => instance.colsNodes.find(node => node?.key === item.key))
      // 剔除无效字段
      const liveFormModel = cutDeadFields(instance.formModel, liveFormItems)
      // 获取桥接对象
      const bridge = mixinBridge()
      
      let res = cloneDeep(liveFormModel)
      // 评估输出转换
      const evalTransform = liveFormItems.map(async item => {
        // 如果有注入参数，则合并
        if (item.injectParam) {
          res = merge(liveFormModel, item.injectParam)
        }
        // 如果有输出转换函数，则调用
        if (item.outputTransform) {
          const transformParam = await item.outputTransform(liveFormModel, item, bridge || {}) || {}
          res = { ...res, ...transformParam }
        }
      })
      // 等待所有转换完成
      await Promise.all(evalTransform)
      return res
    }

    /**
     * 评估存储符号
     * @param {string} formItemKey - 表单项的键
     * @returns {string} 存储符号
     */
    function evalStoreSymbol (formItemKey) {
      return Object.keys(store.value).find(key => key.split('.').includes(formItemKey))
    }

    function getFormModel (formItemKey) {
      const symbol = evalStoreSymbol(formItemKey)
      return store.value[symbol]?.formModel || {}
    }

    /**
     * 获取所有表单模型
     * @param {string} formItemKey - 表单项的键
     * @returns {object[]} 所有表单模型
     */
    function getAllFormModel (formItemKey) {
      const reg = new RegExp(`(\\.|\\b)${formItemKey}(\\.|\\b)`)
      return Object.keys(store.value).filter(k => reg.test(k)).map(k => store.value[k].formModel)
    }

    /**
     * 获取缓存模型
     * @param {string} formItemKey - 表单项的键
     * @returns {object} 缓存模型
     */
    function getCacheModel (formItemKey) {
      const symbol = evalStoreSymbol(formItemKey)
      return store.value[symbol]?.cacheModel || {}
    }

    /**
     * 获取表单项
     * @param {string} formItemKey - 表单项的键
     * @returns {FormEditor.FormItem} 表单项
     */
    function getFormItem (formItemKey) {
      const symbol = evalStoreSymbol(formItemKey)
      return store.value[symbol]?.formItems
        .find(i => i.key === formItemKey) || {}
    }

    // 暴露方法
    ctx.expose({ validate, getValues, getFormModel, getFormItem })

    return {
      setTip,
      setWarning,
      setError,
      formRef,
      instance,
      validate,
      setValue,
      token,
      setAllValue,
      getValue,
      getValues,
      getFormModel,
      getAllFormModel,
      getCacheModel,
      getFormItem,
      mixinBridge
    }
  },
  render() {
    this.instance.colsNodes = this.colsRender()
    const colSlot = { default: () => this.instance.colsNodes }
    const RowSlot = { default: () => h(Row, { type: 'flex' }, colSlot) }
    return h(Form, {
      ref: 'formRef',
      colon: false,
      class: 'form-editor',
      model: this.instance.formModel,
      rules: this.$props.rules
    }, RowSlot)
  }
})

</script>
<style lang="less" scoped>
@divid: 16px;
.form-editor {
  // padding: @divid @divid 0 @divid;
  background: #fff;
  border-radius: 8px;

  :deep(.ant-row) {
    width: 100%;
    .ant-form-item {
      margin: 10px 0;
    }
  }

  :deep(.ant-form-item-label) {
    > label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  :deep(.form-label-readonly) {
    margin-left: @divid;
    color: #999;
    white-space: nowrap;
  }

  :deep(span.form-wrapper-readonly) {
    min-height: 21px;

    .line-standard {
      min-height: 21px;
    }
  }

  :deep(.form-label-colon) {
    margin-left: 0.25rem;
    margin-right: 0.5rem;
  }

  :deep(.form-row-readonly) {
    margin: 0.5rem 0;
  }
}
</style>
