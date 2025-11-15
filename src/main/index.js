/**
 * @ Author: Rongxis
 * @ Create Time: 2025-09-02 16:56:58
 * @ Description: 主进程入口
 */
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import './init.global' // 初始化存储的数据结构
import './init.schedule' // 初始化存储的数据结构
import '@main/apis/index' // 加载所有 API 监听器
// const store = require('@common/services/store')
import { createMain, createModal } from '@common/manager/window.manager'

// const winManager = useWindowManager()

// 当 Electron 完成初始化并准备好创建浏览器窗口时，此方法将被调用
// 某些 API 只能在此事件发生后使用
app.whenReady().then(() => {
  // 为 Windows 系统设置应用用户模型 ID
  electronApp.setAppUserModelId('com.electron');

  // 在开发环境中默认通过 F12 打开或关闭开发者工具
  // 在生产环境中忽略 CommandOrControl + R 快捷键
  // 详见 https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // 创建主窗口
  createMain();
  // 创建modal窗口
  createModal('log');

  // winManager.setMainWindow(mainWindow)

  // 当应用被激活时触发该事件
  app.on('activate', function () {
    // 在 macOS 系统中，当点击 Dock 图标且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createMain();
  });
});

// 当所有窗口都关闭时触发该事件，macOS 系统除外
// 在 macOS 系统中，应用及其菜单栏通常会保持活动状态，直到用户使用 Cmd + Q 显式退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
