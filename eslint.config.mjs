import eslintConfig from '@electron-toolkit/eslint-config';
// import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import eslintPluginVue from 'eslint-plugin-vue';

export default [
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  eslintConfig,
  ...eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx,vue}'],
    rules: {
      semi: 'off',
      'linebreak-style': 'off',
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off'
    }
  },
  {
    globals: {
      PROJECT_NAME: 'readonly',
      STORE_HOME: 'readonly',
      CONFIG_SCHEDULE: 'readonly',
      SCRIPT_SCHEDULE: 'readonly',
      SCRIPTS_HOME: 'readonly',
      LOG_HOME: 'readonly',
      ERR_HOME: 'readonly',
      // 其他全局变量
    },
  }
  // eslintConfigPrettier
];
