<!--
 * @ Author: Rongxis
 * @ Create Time: 2025-03-03 17:38:48
 * @ Description: 可编辑字段
 -->
<template>
<div class="edit-wrapper">
  <!-- 不可编辑状态 -->
  <span v-if="!isCanEdit" text-inherit>{{ view }}</span>
  <!-- 可编辑状态 -->
  <template v-else>
    <div v-if="editState" class="edit-bar">
      <component ref="editComponentRef" :key="key" :is="renderComponent" :value="result" v-bind="$attrs" @blur="confirm"
        @keyup.enter.esc="confirm" @change="change" />
    </div>
    <!-- 在 view 有值时，显示 a 标签 -->
    <a v-else-if="view" @click="editHandler" text-inherit class="expand-click-area">{{ view }}</a>
    <!-- 在 view 为空的时候，显示编辑icon -->
    <span v-else class="edit-icon">
      <EditOutlined @click="editHandler" />
    </span>
  </template>
</div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { EditOutlined } from '@ant-design/icons-vue'
import { isNone } from '@ui/utils/typeof';
import { isDate, date2YMD } from '@ui/utils/date';
import { evalAntdComponent } from '@ui/utils/antd';
import {
  trim,
  isString,
  isArray,
  isNumber,
  isBoolean,
  isObject,
  isFunction
} from 'lodash';

const props = defineProps({
  key: {
    type: String,
    default: '_'
  },
  editComponent: {
    type: [String, Object],
    required: true
  },
  modelValue: {
    type: [Array, Object, String, Number]
  },
  editable: {
    type: [Boolean, Function, String],
    default: true
  },
  required: {
    type: Boolean,
    default: false
  },
  // 如果编辑组件的选项，是对象类型
  // 就需要声明，文本位置，显示的是 选中的选项 的哪个字段
  showField: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['change', 'confirm', 'update:modelValue']);

let cache = '';
const view = ref('');
const scope = ref(this);
const result = ref(null);
const editState = ref(false);
const editComponentRef = ref();
const isCanEdit = computed(() => {
  if (isBoolean(props.editable)) {
    return props.editable;
  } else if (isString(props.editable)) {
    // return hasCatalogButton(props.editable);
    // 一般用于判断是否有编辑权限
    return true
  } else if (isFunction(props.editable)) {
    return props.editable(scope.value);
  } else {
    return true;
  }
});

watch(() => props.modelValue, (val) => {
  debugger
  if (isObject(val) && !val.key && !isDate(val)) return false;
  result.value = val;
  evalView()
}, { immediate: true });

// 编辑状态变更
watch(() => editState.value, () => {
  cache = result.value;
  if (editState.value) {
    nextTick(() => {
      editComponentRef.value.focus()
    })
  }
}, { immediate: true });

// 渲染组件，如果入参是 字符串，就使用 evalAntdComponent 获取组件实例
const renderComponent = computed(() => {
  return evalAntdComponent(props.editComponent)
})

const editHandler = () => {
  editState.value = true
}

const change = (e) => {
  debugger
  result.value = e && e.currentTarget ? e.currentTarget.value : e;
  emit('change', result.value);
  emit('update:modelValue', result.value);
};

const confirm = () => {
  // 必填，但输入框为空值时，不做其他处理
  if (props.required && isNone(result.value)) {
    editState.value = false;
    result.value = cache
    return;
  }
  evalView()
  editState.value = false;
  if (cache !== result.value) {
    emit('confirm', result.value);
  }
};

// 估算显示的文本
function evalView() {
  if (isNone(result.value)) {
    view.value = ''
  } else if (isDate(result.value)) {
    view.value = date2YMD(result.value)
  } else if (isString(result.value) || isNumber(result.value)) {
    view.value = result.value;
  } else if (isArray(result.value)) {
    view.value = result.value.map((option) => {
      if (isObject(option)) {
        return props.showField ? option[props.showField] : option.label
      } else {
        return option
      }
    }).join(',')
  } else if (isObject(result.value)) {
    view.value = props.showField ? option[props.showField] : option.label
  }
}
</script>

<style lang="less" scoped>
.edit-wrapper {
  display: flex;
  width: 100%;
  align-items: center;
  .edit-icon {
    color: #2dc84d;
    width: 22px;
  }
  .edit-bar {
    display: flex;
    width: calc(100% - 22px);
    align-items: center;
    > * {
      min-width: 8rem;
    }
    .confirm-button {
      margin-left: 4px;
      min-width: 4rem;
    }
  }
  .edit-modify {
    margin-left: 0.5rem;
  }
}

</style>
