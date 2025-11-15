/**
 * 等待 condition 的结果为 true，最多等待 times 次，每次间隔 delay 毫秒
 * @param {*} condition 
 * @param {*} delay 
 * @param {*} times 
 * @returns 
 */
export const waitBy = async (condition, delay = 500, times = 10) => {
  const loopEntity = async (resolve, itimes) => {
    const expection = await condition()
    if (!!expection || itimes < 0) {
      return resolve(expection)
    } else {
      return setTimeout(
        () => {
          itimes--
          return loopEntity(resolve, itimes)
        },
        delay
      )
    }
  }
  return new Promise((resolve) => {
    return loopEntity(resolve, times)
  })
}
