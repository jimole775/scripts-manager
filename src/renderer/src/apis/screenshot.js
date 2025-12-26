/**
 * @ Author: rongxis
 * @ Create Time: 2025-12-26
 * @ Description: 截图相关 API
 */

import { ipcMain, desktopCapturer, BrowserWindow } from 'electron'

console.log('screenshot.js 模块已加载')

// 获取桌面源（用于截图）
ipcMain.handle('GET_DESKTOP_SOURCES', async (event) => {
  console.log('GET_DESKTOP_SOURCES 被调用')
  try {
    // 获取所有屏幕源
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],  // 包括屏幕和窗口
      thumbnailSize: {
        width: 3840,  // 支持 4K 屏幕
        height: 2160
      },
      fetchWindowIcons: false
    })
    
    console.log('获取到桌面源:', sources.length, '个')
    
    // 返回源信息
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }))
  } catch (error) {
    console.error('获取桌面源失败:', error)
    return []
  }
})

// 截取全屏静态图
ipcMain.handle('CAPTURE_SCREEN', async (event) => {
  console.log('CAPTURE_SCREEN 被调用')
  try {
    // 获取当前窗口
    const win = BrowserWindow.fromWebContents(event.sender)
    
    // 保存原始窗口状态
    const originalBounds = win ? win.getBounds() : null
    const wasFullScreen = win ? win.isFullScreen() : false
    const wasMaximized = win ? win.isMaximized() : false
    
    // 临时隐藏窗口
    if (win) {
      win.hide()
    }
    
    // 等待窗口隐藏动画完成
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 获取屏幕源
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: 3840,
        height: 2160
      }
    })
    
    if (sources.length === 0) {
      // 恢复窗口显示
      if (win) {
        win.show()
      }
      return { success: false, error: '没有找到屏幕源' }
    }
    
    // 使用第一个屏幕（主屏幕）
    const primaryScreen = sources.find(s => 
      s.name.includes('Entire Screen') || 
      s.name.includes('Screen 1') ||
      s.name.toLowerCase().includes('screen')
    ) || sources[0]
    
    console.log('截取屏幕:', primaryScreen.name)
    
    // 获取缩略图（这是一张静态图）
    const thumbnail = primaryScreen.thumbnail
    const imageData = thumbnail.toDataURL()
    const size = thumbnail.getSize()
    
    // 恢复窗口并设置为全屏
    if (win) {
      win.show()
      win.setFullScreen(true)
      win.focus()
    }
    
    return {
      success: true,
      imageData: imageData,
      width: size.width,
      height: size.height,
      originalBounds: originalBounds,
      wasFullScreen: wasFullScreen,
      wasMaximized: wasMaximized
    }
  } catch (error) {
    console.error('截取屏幕失败:', error)
    
    // 确保窗口恢复显示
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.show()
    }
    
    return { success: false, error: error.message }
  }
})

// 退出截图模式，恢复窗口状态
ipcMain.handle('EXIT_SCREENSHOT_MODE', async (event, originalState) => {
  console.log('EXIT_SCREENSHOT_MODE 被调用')
  try {
    const win = BrowserWindow.fromWebContents(event.sender)
    
    if (win) {
      // 退出全屏
      win.setFullScreen(false)
      
      // 等待退出全屏动画
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 恢复原始状态
      if (originalState) {
        if (originalState.wasFullScreen) {
          win.setFullScreen(true)
        } else if (originalState.wasMaximized) {
          win.maximize()
        } else if (originalState.originalBounds) {
          win.setBounds(originalState.originalBounds)
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('退出截图模式失败:', error)
    return { success: false, error: error.message }
  }
})

console.log('screenshot.js IPC handlers 已注册')
