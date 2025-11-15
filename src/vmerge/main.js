/**
 * @ Author: Rongxis
 * @ Create Time: 2025-01-10 09:51:07
 * @ Modified time: 2025-02-13 17:54:46
 * @ Description: 根据提供的 任务id 提取所有包含这个 id 的分支，进行合并
 * todo 合并分支时，不能单纯合分支，如果没有探测到指定的 fix 分支，
 * 可以从 commit 列表中判断是否在某个分支已经处理了这个BUG，而没有新建分支，
 * 一般的开发流程中，一个任务可能会产生多个 bug，所以需要根据 bug id 来判断是否存在这个分支，会导致开发过程比较繁琐
 */
import os from 'os'
// import path from 'path'
import { cmd } from '@common/utils/system'
import { filter } from '@common/utils/dir'
import { execSync } from 'child_process'
import Logger from '@common/bus/log.bus'
import { get } from '@common/services/store'
import { string2array, trim } from '@common/utils/data'

import {
  stashRevert,
  stashModified,
  updateBranch,
  getCurrentBranch,
  hasLocalBranch,
  hasRemoteBranch
} from '@common/utils/git';
// 当前目录名，就是脚本名
const scriptName = 'vmerge'
// 使用 global.logger，可以让工具类内部也共享这个 logger 实例
const scriptLogger = global.loggerBus = new Logger(scriptName);
// 桌面端需要从 store 获取配置信息，如果直接运行脚本，从 ./config.json 获取信息
const config = get('script.json', scriptName);
const target = trim(config['scan_dir']) || process.cwd(); // 需要扫描的目录
const user = trim(config['user.name']) || 'manager'; // 分支命名的关键字段
const releaseBranch = trim(config['release_branch']) || 'prod'; // 发布分支名
const ignoreFolders = string2array(config['scan_ignore_folders']);

// 定义数字数组
const tapdTasks = string2array(config['tapd_tasks']);
const tapdBugs = string2array(config['tapd_bugs']);

const taskRegExps = tapdTasks.map((id) => new RegExp(`feat(-|ure)?${id}@`, 'i'));
const bugRegExps = tapdBugs.map((id) => new RegExp(`(fix|bug)-?${id}@`, 'i'));

const isWindows = os.platform() === 'win32'; // 检测操作系统
const stashMessage = `[${scriptName}] Before Run State`;
const errorMessage = `[${scriptName}] Error State`;

// 捕获 Ctrl + C 信号
process.on('SIGINT', () => {
  scriptLogger.log('Process interrupted by user.');
  process.exit(1);
});

main();

function main() {
  // clear('log'); // 清空日志文件

  let merged = {
    bugs: [
      /** { dir: '', branch: '' } */
    ],
    tasks: [
      /** { dir: '', branch: '' } */
    ],
    errs: [
      /** { dir: '', branch: '' } */
    ]
  };

  // 获取 target 目录下的 git 项目
  const proDirs = filter(target, (dir) => /\.git$/.test(dir), ignoreFolders)
    .map((i) => i.replace(/\.git$/, ''));

  proDirs.forEach((dir) => {
    mergesBranchs(dir, merged);
  });

  output(merged);
}

/**
 * 输出 commit 信息
 * @param {Object} merged
 * @return {void}
 */
function output(merged) {
  const success = merged.tasks.concat(merged.bugs);
  if (success.length) {
    scriptLogger.log('>======================== 已合并分支 (start) =========================<');
    success.forEach((task) => {
      scriptLogger.log('分支名:', task.branch, '项目:', task.dir);
    });
    scriptLogger.log('>====================== 已合并分支 tasks (end) =======================<');
  }
  if (merged.errs.length) {
    scriptLogger.log('>====================== 合并失败的分支 (start) =======================<');
    merged.errs.forEach((bug) => {
      scriptLogger.log('分支名:', bug.branch, '项目:', bug.dir);
    });
    scriptLogger.log('>======================= 合并失败的分支 (end) ========================<');
  }
  const leftTasks = diff(
    merged.tasks.map((i) => i.id),
    tapdTasks
  );
  if (leftTasks.length) {
    scriptLogger.log('未合并 task:', leftTasks.join(','));
  }
  const leftBugs = diff(
    merged.bugs.map((i) => i.id),
    tapdBugs
  );
  if (leftBugs.length) {
    scriptLogger.log('未合并 bug:', leftBugs.join(','));
  }
}

/**
 * 合并逻辑
 * @param {String} repoDir 项目名：用于报错提示
 * @param {String} branch 分支名
 * @returns {Boolean} 合并是否成功
 */
function doMerge(repoDir, branch) {
  let rebaseResult;
  try {
    // 合并之前需要拉取更新，因为有可能在非开发的机器上执行合并操作
    updateBranch(branch);
    // todo 这里会莫名其妙的被 try catch 捕获，所以需要改为从返回信息中判断是否 rebase 或者 merge 失败
    rebaseResult = cmd(`git rebase ${branch}`, { encoding: 'utf8' });
    return true;
  } catch (error) {
    scriptLogger.log(`${repoDir}, ${branch} 分支在执行 rebase 时报错: ${rebaseResult}`);
    cmd(`git rebase --abort`); // 如果报错，就执行 --abort 指令
    return false;
  }
}

/**
 * 执行合并逻辑
 * @param {String} repoDir 项目目录
 * @param {Object} res 结果对象
 * @return {void}
 */
function mergesBranchs(repoDir, res) {
  try {
    scriptLogger.log(`切换到目录: ${repoDir}`);
    process.chdir(repoDir); // 切换指令

    // 拉取最新的发布分支
    const syncRes = updateBranch(releaseBranch);
    if (!syncRes) {
      return scriptLogger.log(`${repoDir} 不存在 ${releaseBranch} 分支，跳过合并流程！`);
    }

    // 暂存当前的变更
    stashModified(stashMessage);

    // 切换分支之前，先获取当前工作分支名
    const workBranch = getCurrentBranch();

    // 创建合并分支
    const mergeBranch = genMergeBranch();

    if (!mergeBranch) {
      return scriptLogger.log(`${repoDir}, ${mergeBranch} 分支创建失败，跳过合并流程！`);
    }

    // 获取所有分支名
    const branchList = getAllBranchs();

    // 遍历分支名
    for (const branch of branchList) {
      const tapdId = branch.match(/\d+/) ? branch.match(/\d+/)[0] : branch;
      // 分支名符合正则，就执行合并操作
      if (taskRegExps.find((regx) => regx.test(branch))) {
        const success = doMerge(repoDir, branch);
        if (success) {
          res.tasks.push({
            branch,
            id: tapdId,
            dir: repoDir
          });
        } else {
          res.errs.push({
            branch,
            id: tapdId,
            dir: repoDir
          });
        }
      }
      // 分支名符合正则，就执行合并操作
      if (bugRegExps.find((regx) => regx.test(branch))) {
        const success = doMerge(repoDir, branch);
        if (success) {
          res.bugs.push({
            branch,
            id: tapdId,
            dir: repoDir
          });
        } else {
          res.errs.push({
            branch,
            id: tapdId,
            dir: repoDir
          });
        }
      }
    }

    // 推送分支
    pushMergeBranch(mergeBranch);

    // 如果在合并过程中，有报错之类的变更，直接 stash 掉，让操作者自己检查
    stashModified(errorMessage);

    // 切换回原工作分支
    cmd(`git checkout ${workBranch}`);

    // 最后再弹出合并之前暂存的内容
    stashRevert(stashMessage);

    scriptLogger.log(`${repoDir} 流程执行完毕！`);
  } catch (error) {
    scriptLogger.log(`${repoDir}, 执行合并流程时报错: ${error.message}`);
    // 在合并过程中，有报错之类的，直接 stash 掉，让操作者自己检查
    stashModified(errorMessage);

    // 最后再弹出合并之前暂存的内容
    stashRevert(stashMessage);
  }
}

// 获取当前项目的所有分支（包括远程分支和本地分支）
function getAllBranchs() {
  cmd('git fetch'); // 先拉取所有分支头信息（包括远程分支）

  // 获取本地所有分支名
  const localBranchList = execSync('git branch --list', { encoding: 'utf8' })
    .split('\n')
    .map((i) => i.trim().replace(/^\* /, '')) // 去掉前面的*和空格
    .filter(Boolean);

  // 获取所有远程分支
  const remoteBranchList = execSync('git branch -r', { encoding: 'utf8' })
    .split('\n')
    .map((i) => i.trim().replace(/^origin\//, '')) // 去掉前面的 origin/
    .filter(Boolean);

  // 返回时，执行去重操作
  const allBranchList = localBranchList.concat(remoteBranchList);
  return Array.from(new Set(allBranchList));
}

/**
 * 推送合并分支
 * @param {String} mergeBranch 合并分支名
 * @return {void}
 */
function pushMergeBranch(mergeBranch) {
  // 把 版本合并分支 推送到 gitlab
  cmd(`git push -u origin ${mergeBranch}`);
}

/**
 * 根据时间 生成合并分支名
 * @return {String} 合并分支名
 */
function genMergeBranchName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `V${year}${month}${day}@${user}`;
}

/**
 * 根据时间 创建合并分支
 * @return {String} 合并分支名
 */
function genMergeBranch() {
  // 生成合并分支名称
  const mergeBranch = genMergeBranchName();
  try {
    // 先切换到 发版分支
    cmd(`git checkout ${releaseBranch}`);

    // 如果 合并分支 已经存在，就直接删除
    if (hasLocalBranch(mergeBranch)) {
      cmd(`git branch -D ${mergeBranch}`);
    }

    // 如果 远程合并分支 已经存在，就直接删除
    if (hasRemoteBranch(mergeBranch)) {
      cmd(`git push origin --delete ${mergeBranch}`);
    }

    // 创建分支之前，先更新 releaseBranch，否则 rebase 时，会出现多次 commit 的记录
    updateBranch(releaseBranch);

    // 以发布分支为基，创建合并分支
    cmd(`git checkout -b ${mergeBranch} ${releaseBranch}`);

    return mergeBranch;
  } catch (error) {
    scriptLogger.log(`创建 ${mergeBranch} 分支时报错: ${error.message}`);
    return '';
  }
}

/**
 * 返回 arr2 有， arr1 没有 的项
 * @param {Array} arr1 数组1
 * @param {Array} arr2 数组2
 * @return {Array} 差异数组
 */
function diff(arr1 = [], arr2 = []) {
  const reg = new RegExp(`\(${arr1.join('|')}\)`, 'g');
  return arr2.join(',').replace(reg, '').split(',').filter(Boolean);
}
