/**
 * @ Author: Rongxis
 * @ Create Time: 2025-09-02 16:56:38
 * @ Description: 全局变量初始化
 */
import LoggerBus from "@common/bus/log.bus";
import ProgressBus from "@common/bus/progress.bus";

global.loggerBus = new LoggerBus(); // 整个主进程只有一个 loggerBus 实例
global.progressBus = new ProgressBus(); // 整个主进程只有一个 progressBus 实例
