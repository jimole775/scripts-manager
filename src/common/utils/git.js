/**
 * @ Author: Rongxis
 * @ Create Time: 2025-01-21 16:17:46
 * @ TAPD: 无
 * @ Description: 处理 git 仓库的方法集
 */
import { cmd } from './system'
const defaultSymbol = `[ScriptsManager]`;
/**
 * 判断当前是否有变更的内容，有的话进行暂存
 * @param {String} message - 暂存的消息
 * @returns {void}
 */
export const stashModified = (message = defaultSymbol) => {
  const status = cmd('git status --porcelain', { log: false });
  if (status) {
    cmd(`git add .`);
    cmd(`git stash push -m "${message}"`);
  }
};

/**
 * 根据提供的 message 来弹出对应的 stash
 * @param {String} message - 暂存的消息
 * @returns {void}
 */
export const stashRevert = (message = defaultSymbol) => {
  const stashes = cmd('git stash list', { log: false }).split('\n');
  const stash = stashes.find((s) => s.includes(message));
  if (stash) {
    const stashRef = stash.split(':')[0];
    cmd(`git stash pop ${stashRef}`);
  }
};

/**
 * 获取当前分支名
 * @returns {String} - 当前分支名
 */
export const getCurrentBranch = () => {
  const currentBranch = cmd('git rev-parse --abbrev-ref HEAD', { log: false });
  return currentBranch ? currentBranch.trim() : '';
};

/**
 * 判断是否有远程分支
 * @param {String} branch - 分支名称
 * @returns {Boolean} - 如果有远程分支，返回 true；否则返回 false
 */
export const hasRemoteBranch = (branch) => {
  try {
    const result = cmd(`git ls-remote --heads origin ${branch}`, { log: false });
    return !!result;
  } catch (error) {
    global.loggerBus.err('判断是否有远程分支时报错:', error.message);
    return false;
  }
};

/**
 * 更新指定分支
 * @param {String} branch - 分支名称，默认为 'prod'
 * @returns {Boolean} - 更新成功返回 true，否则返回 false
 */
export const updateBranch = (branch = 'prod') => {
  // 判断是否有远程分支
  if (!hasRemoteBranch(branch)) return false;

  // 获取当前分支名称
  const workBranch = getCurrentBranch();

  // 如果当前就是目标分支，就直接执行 pull 操作
  if (workBranch === branch) {
    cmd(`git pull origin ${branch}`);
  } else {
    // 暂存当前 changes
    stashModified(`${defaultSymbol} update branch`);

    const isLocal = hasLocalBranch(branch);
    if (isLocal) {
      cmd(`git checkout ${branch}`);
    } else {
      // 没有目标分支，就用 -b 新建目标分支
      cmd(`git checkout -b ${branch} --track origin/${branch}`);
    }

    // 拉取 release 分支特性
    cmd(`git pull origin ${branch}`);

    // 切换回原来的分支
    cmd(`git checkout ${workBranch}`);

    // 还原 changes
    stashRevert(`${defaultSymbol} update branch`);
  }

  return true;
};

/**
 * 检查本地分支是否存在
 * @param {String} branchName - 要检查的分支名称
 * @returns {Boolean} - 如果分支存在，返回 true；否则返回 false
 */
export function hasLocalBranch(branchName) {
  try {
    // 获取所有本地分支列表
    const branches = cmd('git branch --list', { log: false })
      .split('\n')
      .map((branch) => branch.trim().replace(/^\* /, '')) // 去掉前面的*和空格
      .filter(Boolean);

    // 检查目标分支是否在列表中
    return branches.includes(branchName);
  } catch (error) {
    global.loggerBus.err('检查本地分支是否存在时报错:', error.message);
    return false;
  }
}
