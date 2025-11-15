/**
 * @ Author: Rongxis
 * @ Create Time: 2025-01-10 10:43:09
 * @ Modified time: 2025-02-18 11:16:46
 * @ Description: 根据提供的 任务id ，去发版分支去匹配 所有的 commit 中，是否有包含 任务ID
 */
import os from 'os'
import { filter } from '@common/utils/dir'
import { updateBranch } from '@common/utils/git'
import { get } from '@common/services/store'
import { cmd } from '@common/utils/system'
import Logger from '@common/bus/log.bus'
import Progress from "@common/bus/progress.bus";
import { string2array, trim } from '@common/utils/data'

// 当前目录名，就是脚本名
const scriptName = global.scriptName = 'vcommit'
// 使用 global.logger，可以让工具类内部也共享这个 logger 实例
const scriptLogger = global.loggerBus = new Logger(scriptName);
const progressBus = global.progressBus = new Progress(scriptName); // 整个主进程只有一个 progress 实例
// 桌面端需要从 store 获取配置信息
const config = get('script.json', scriptName);
const isWindows = os.platform() === 'win32'; // 检测操作系统
const target = trim(config['scan_dir']); // 需要扫描的目录
const commitLength = trim(config['checks_commit_limit']) || 699; // 需要比对的commit数量
const releaseBranch = trim(config['release_branch']) || 'prod'; // 发布分支名
const ignoreFolders = string2array(config['scan_ignore_folders']);

// 捕获 Ctrl + C 信号
process.on('SIGINT', () => {
  scriptLogger.log('Process interrupted by user.');
  process.exit(1);
});

// 捕获 SIGTERM 信号
process.on('SIGTERM', () => {
  scriptLogger.log('Received SIGTERM signal, exiting...');
  process.exit(1);
});

// 需要扫描的 id 号
let tapdBugs = config['tapd_bugs'].split(',') || [];
let tapdTasks = config['tapd_tasks'].split(',') || [];

// start
main()

// 递归扫描目录
async function main() {
  progressBus.init();
  // clear('log'); // 清空日志文件
  let mommited = {
    bugs: [
      /** { dir: '', id: '' } */
    ],
    tasks: [
      /** { dir: '', id: '' } */
    ]
  };

  // 获取 target 目录下的 git 项目
  const proDirs = filter(target, (dir) => /\.git$/.test(dir), ignoreFolders)
    .map((i) => i.replace(/\.git$/, ''));
  progressBus.setStepAmount(proDirs.length);
  for (const dir of proDirs) {
    // 切换到仓库目录
    process.chdir(dir)
    matchCommits(dir, mommited);
    progressBus.update();
  }

  output(mommited);
  process.exit()
}

/**
 * 输出 commit 信息
 * @param {Object} mommited
 */
function output(mommited) {
  if (mommited.tasks.length) {
    scriptLogger.log('>===================== 已提交 tasks (start) ======================<');
    mommited.tasks.forEach((task) => {
      scriptLogger.log('已提交 task:', task.id, task.dir);
    });
    scriptLogger.log('>====================== 已提交 tasks (end) =======================<');
  }
  if (mommited.bugs.length) {
    scriptLogger.log('>====================== 已提交 bugs (start) =======================<');
    mommited.bugs.forEach((bug) => {
      scriptLogger.log('已提交 bug:', bug.id, bug.dir);
    });
    scriptLogger.log('>======================= 已提交 bugs (end) ========================<');
  }
  const leftTasks = diff(
    mommited.tasks.map((i) => i.id),
    tapdTasks
  );
  if (leftTasks.length) {
    scriptLogger.log('未提交 task:', leftTasks.join(','));
  }
  const leftBugs = diff(
    mommited.bugs.map((i) => i.id),
    tapdBugs
  );
  if (leftBugs.length) {
    scriptLogger.log('未提交 bug:', leftBugs.join(','));
  }
}

// 返回 arr2 有， arr1 没有 的项
function diff(arr1 = [], arr2 = []) {
  const reg = new RegExp(`\(${arr1.join('|')}\)`, 'g');
  return arr2.join(',').replace(reg, '').split(',').filter(Boolean);
}

// 执行commit匹配逻辑
function matchCommits(repoDir, res) {
  try {
    // 拉取最新的发布分支
    const syncRes = updateBranch(releaseBranch);
    if (!syncRes) {
      return scriptLogger.log(`${repoDir} 不存在 ${releaseBranch} 分支，跳过检测！`);
    }

    // 获取发布分支的n条commit
    const commitList = cmd(`git log ${releaseBranch} --oneline -n ${commitLength} ${releaseBranch}`)
      .split('\n')
      .map((i) => i.trim().replace(/^\* /, ''))
      .filter(Boolean);

    // 遍历 commit 文本
    for (let commit of commitList) {
      // 遍历 BUG id
      tapdBugs.find((bugId) => {
        // 判断commit包不包含指定的 ID
        if (commit.includes(`--bug=${bugId} `)) {
          res.bugs.push({
            id: bugId,
            dir: repoDir
          });
        }
      });

      // 遍历 任务 id
      tapdTasks.find((taskId) => {
        // 判断commit包不包含指定的 ID
        if (commit.includes(`--story=${taskId} `)) {
          res.tasks.push({
            id: taskId,
            dir: repoDir
          });
        }
      });
    }

    scriptLogger.log(`${repoDir} 扫描完毕！`);
  } catch (error) {
    scriptLogger.log(`${repoDir} 执行扫描流程时报错: ${error.message}`);
  }
}
