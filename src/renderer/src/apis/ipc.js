import { parse } from '@common/utils/data'
const electron = window.electron || {}
export const ipcPost = (event, data) => {
  electron.ipcRenderer.send(event, { data: parse(data) });
  return new Promise((resolve, reject) => {
    electron.ipcRenderer.once(event, (event, res) => {
      if (res.status === 200) {
        return resolve(res.data)
      } else {
        return reject(res.message)
      }
    })
  })
}
