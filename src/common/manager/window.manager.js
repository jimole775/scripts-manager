/**
 * @ Author: Rongxis
 * @ Create Time: 2025-04-18 08:46:58
 * @ Description: 全局窗口管理
 */
import { join } from 'path';
import { shell, BrowserWindow, screen } from 'electron';

let mainWindow = null // 主窗口实例
let modalsMap = Object.create(null) // 日志窗口实例

const isDev = () => process.env.NODE_ENV === 'development' || process.env.ELECTRON_ENV === 'development';

const MAIN_DEFAULT_CONFIG = {
  template: join(__dirname, '../renderer/index.html'),
  preload: join(__dirname, '../scripts/preload.js')
}

const MODAL_DEFAULT_CONFIG = {
  template: join(__dirname, '../renderer/modal.html'),
  preload: join(__dirname, '../scripts/preload.js')
}

// 创建主窗口实例
export const createMain = () => {
  mainWindow = createMainWindow()
  return mainWindow
}

// 获取主窗口实例
export const getMain = () => mainWindow

// 创建日志窗口实例
export const createModal = (modalName = 'default') => {
  const modalInstance = createPopupWindow();
  // 监听窗口关闭事件，关闭时从 modalsMap 中移除该实例
  modalInstance.on('closed', () => {
    delete modalsMap[modalName];
  });
  modalsMap[modalName] = modalInstance // 缓存日志窗口实例

  return modalInstance
}

// 获取日志窗口实例
export const getModal = (modalName = 'default') => {
  if (modalsMap[modalName]) { return modalsMap[modalName] } // 如果已经存在，则直接返回
  else { return createModal(modalName) } // 如果不存在，则创建并返回
}
/**
 * 创建主窗口实例
 * @returns {BrowserWindow} 返回创建好的主窗口实例
 */
function createMainWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    // autoHideMenuBar: true,
    // 如果是 Linux 系统，则设置窗口图标
    // ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // 指定预加载脚本的路径
      preload: MAIN_DEFAULT_CONFIG.preload,
      sandbox: false
    }
  });

  // 当窗口准备好显示时触发该事件
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // 设置窗口打开处理器，当渲染进程尝试打开新窗口时触发
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // 使用系统默认浏览器打开链接
    shell.openExternal(details.url);
    // 拒绝在 Electron 应用内打开新窗口
    return { action: 'deny' };
  });
  // 基于 electron-vite 实现渲染进程的热更新
  // 开发环境加载远程 URL，生产环境加载本地 HTML 文件
  if (isDev() && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(MAIN_DEFAULT_CONFIG.template);
  }

  // 返回 mainWindow 实例，以便在其他地方使用，如在 ipc.handler.js 中使用 mainWindow 对象来发送消息给 renderer 进程
  return mainWindow; 
}

// 创建一个弹窗，初始位置定于主窗口右侧，和主窗口同高，宽度为 360px
function createPopupWindow(config = {
  width: 360,
  height: 670,
  x: 900,
  y: 0,
  winName: 'default', // 弹窗的 name
}) {
  const { width: mainWidth, height, x, y } = mainWindow.getBounds();
  const isFullScreen = mainWindow.isFullScreen();
  const display = screen.getDisplayNearestPoint({ x, y });
  const screenWidth = display.workAreaSize.width;

  let popupWidth = config.width;
  let popupX = x + mainWidth;
  const popupY = y;
  const combinedWidth = mainWidth + popupWidth;
  // 处理全屏或总宽度超过屏幕宽度的情况
  if (isFullScreen || combinedWidth > screenWidth) {
    const ratio = screenWidth / combinedWidth;
    const newMainWidth = Math.floor(mainWidth * ratio); // 根据百分比重新分配主窗口宽度
    popupWidth = screenWidth - newMainWidth; // 根据剩余宽度给弹窗分配宽度
    popupX = x + newMainWidth; // 弹窗的 x 坐标
    mainWindow.setBounds({ width: newMainWidth }); // 调整主窗口宽度
    // mainWindow.setBounds({ width: newMainWidth, height, x, y });
  }

  // 创建弹窗实例
  const popupWindow = new BrowserWindow({
    width: popupWidth,
    height,
    x: popupX,
    y: popupY,
    show: false,
    frame: true,
    // skipTaskbar: true, // 隐藏在任务栏中
    // transparent: true,
    webPreferences: {
      preload: MAIN_DEFAULT_CONFIG.preload,
      // nodeIntegration: true,
      // contextIsolation: false,
      sandbox: false
    }
  });
  if (isDev() && process.env['ELECTRON_RENDERER_URL']) {
    popupWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/modal.html');
  } else {
    popupWindow.loadFile(MODAL_DEFAULT_CONFIG.template);
  }
  return popupWindow;
}
