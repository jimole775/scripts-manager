// 图片存储策略：
// 1. 缩略图存储在内存 Map 中（小，用于显示）
// 2. 原图存储在 IndexedDB 中（大，按需加载）

const thumbnailStore = new Map() // 内存中的缩略图存储
const imageCache = new Map() // 原图的临时缓存

// IndexedDB 配置
const DB_NAME = 'ImageStore'
const DB_VERSION = 1
const STORE_NAME = 'images'

let db = null

// 初始化 IndexedDB
async function initDB() {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * 存储缩略图到内存
 */
export function storeThumbnail(id, thumbnailData) {
  thumbnailStore.set(id, thumbnailData)
}

/**
 * 获取缩略图（从内存）
 */
export function getThumbnail(id) {
  return thumbnailStore.get(id)
}

/**
 * 删除缩略图
 */
export function deleteThumbnail(id) {
  thumbnailStore.delete(id)
}

/**
 * 存储原图到 IndexedDB
 */
export async function storeImage(id, imageData) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(imageData, id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('存储图片失败:', error)
    // 降级：存储到内存
    imageCache.set(id, imageData)
  }
}

/**
 * 获取原图（从 IndexedDB 或缓存）
 */
export async function getImage(id) {
  // 先检查缓存
  if (imageCache.has(id)) {
    return imageCache.get(id)
  }
  
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)
      
      request.onsuccess = () => {
        const imageData = request.result
        // 缓存到内存中，下次直接使用
        if (imageData) {
          imageCache.set(id, imageData)
        }
        resolve(imageData)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('获取图片失败:', error)
    return null
  }
}

/**
 * 删除图片
 */
export async function deleteImage(id) {
  // 从缓存中删除
  imageCache.delete(id)
  
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('删除图片失败:', error)
  }
}

/**
 * 清空所有图片
 */
export async function clearAllImages() {
  thumbnailStore.clear()
  imageCache.clear()
  
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('清空图片失败:', error)
  }
}

/**
 * 获取存储的图片数量
 */
export async function getImageCount() {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('获取图片数量失败:', error)
    return 0
  }
}

/**
 * 清理缓存（保留最近使用的 N 张图片）
 */
export function clearImageCache(keepCount = 10) {
  if (imageCache.size > keepCount) {
    const entries = Array.from(imageCache.entries())
    const toDelete = entries.slice(0, entries.length - keepCount)
    toDelete.forEach(([id]) => imageCache.delete(id))
    console.log(`清理了 ${toDelete.length} 张缓存图片`)
  }
}
