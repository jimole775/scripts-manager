// 模拟并发线程，控制宏任务执行数量
// 声明一下执行前缀，否则在流程中不好定位
const LogTag = 'utils.BunchThread => ';
const bunchLimit = 6; // 默认并发数
const sleepTimes = 3000; // 忙线状态时的并发间隔
const busy = false; // 并发是否运行在忙线状态

/**
 * 并发线程
 */
class BunchThread {
  /**
   * 构造函数
   * @param { Number } limit
   * @return { BunchThread }
   */
  constructor(limit = bunchLimit) {
    this.limit = limit; // 一组并发上限数
    this.paramList = []; // 参数列表
    this.taskQueue = []; // 注册的并发任务队列
    this.taskLivingIds = []; // 当前在运行的任务 ID
    this.consumedIds = []; // 已消耗的任务 ID，用于 并发类型 中比对是否所有任务都执行完
    this.taskLiving = 0; // 正在运行的任务数，用于 串行类型 中比对是否所有任务都执行完
    this.busy = busy; // 是否忙线状态
    this.sleepTimes = sleepTimes; // 忙线状态的并发间隔时间
    this.endCallback = () => console.log('Bunch End!');
    return this;
  }

  /**
   * 注册并发执行函数
   * @param { Array } paramList
   * @param { Function } taskEntity
   * @return { BunchThread }
   */
  register(paramList, taskEntity) {
    this.paramList = paramList || [];
    this.taskEntity = taskEntity || function () {};
    return this;
  }

  /**
   * 并发发起
   * @return { BunchThread }
   */
  async emit() {
    if (this.paramList && this.paramList.length) {
      const max = this.paramList.length;
      for (let i = 0; i < max; i++) {
        const param = this.paramList[i];
        /**
         * @return { void }
         */
        const task = async () => {
          await this.taskEntity(param, i);
        };
        task.id = i;
        this.taskQueue.push(task);
        this.taskLivingIds.push(i);
        console.log('并发队列剩余：', max - i);
        if (this.taskLivingIds.length >= this.limit) {
          await this._waitConsumeUnderLimit();
        } else {
          this._taskNormalConsume();
        }
      }
    }
    return this;
  }

  /**
   * 串行调用方式
   * @param { Function } $$task
   * @return { BunchThread }
   */
  taskCalling($$task) {
    if (this.taskLiving >= this.limit) {
      this.taskQueue.push($$task);
    } else {
      this._thread($$task);
    }
    this.taskLiving++;
    return this;
  }

  /**
   * 队列结束后的回调
   * @param { Function } callback
   * @return { BunchThread }
   */
  finally(callback) {
    this.endCallback = callback;
    return this;
  }

  /**
   * 任务队列在 limit 之下，则正常消耗执行
   * @return { void }
   */
  async _taskNormalConsume() {
    if (this.taskQueue.length) {
      const task = this.taskQueue.shift();
      await task();
      this._livingIdReduce(task);
    }
  }

  /**
   * 消耗执行后，记录的 id 随着调整
   * @param { Function } task
   * @return { void }
   */
  _livingIdReduce(task) {
    const idIndex = this.taskLivingIds.indexOf(task.id);
    this.taskLivingIds.splice(idIndex, 1);
    this.consumedIds.push(task.id);
    if (this.consumedIds.length === this.paramList.length) {
      this.endCallback();
    }
  }

  /**
   * 等待任务队列消耗到 limit 之下
   * @return { Promise }
   */
  _waitConsumeUnderLimit() {
    return new Promise((resolve, reject) => {
      return this._consumeLoop(resolve);
    });
  }

  /**
   * 消耗任务队列 直到 任务队列消耗到 limit 之下
   * @param { Function } resolve
   * @return { void }
   */
  async _consumeLoop(resolve) {
    if (this.taskLivingIds.length < this.limit) {
      return resolve();
    } else {
      if (this.taskQueue.length) {
        const task = this.taskQueue.shift();
        await task();
        this._livingIdReduce(task);
        return this._consumeLoop(resolve);
      } else {
        return resolve();
      }
    }
  }

  /**
   * 线程实例
   * @param { Function } $$task
   * @return { void }
   */
  async _thread($$task) {
    try {
      await $$task();
    } catch (error) {
      // 报错了不处理，让每个任务注入前自己处理自己的异常
      console.log(LogTag, '_thread error:', error);
    }

    // 如果是 busy 模式，每个任务执行后需要睡眠指定的时间
    // 默认为 3 秒
    if (this.busy) {
      await this._sleep(this.sleepTimes);
    }
    this.taskLiving--;
    if (this.taskQueue.length) {
      // 执行任务队列
      return this._thread(this.taskQueue.shift());
    } else {
      // 任务队列清零后，执行结束回调
      if (this.taskLiving <= 0) {
        this.taskLiving = 0;
        return this.endCallback();
      }
    }
  }

  /**
   * 睡眠函数
   * @param { Number } time
   * @return { Promise }
   */
  _sleep(time) {
    return new Promise((s, j) => {
      setTimeout(s, time);
    });
  }
}

// 测试代码
if (require.main === module) {
  const bunch = new BunchThread(1);
  bunch.sleepTimes = 5000; // 一组并发执行完后，间隔 5s 再往下执行
  bunch.bunchLimit = 10; // 一组并发数
  bunch.busy = true; // 开启忙线模式
  bunch.register(new Array(100).fill(1), (item, i) => {
    return new Promise((s, j) => {
      setTimeout(() => {
        console.log(i);
        s();
      }, Math.random() * 5000);
    });
  });
  bunch.emit();
}

module.exports = BunchThread;
