/**
 * extensionIpc.js - 1Password 扩展 IPC 通信处理器
 * 
 * 负责:
 * - 处理渲染进程与主进程之间的 1Password 扩展配置通信
 * - 提供获取/设置配置、验证路径、选择文件夹等功能
 * 
 * IPC 通道:
 * - 1password:get-config: 获取当前配置
 * - 1password:set-config: 更新配置
 * - 1password:validate-path: 验证扩展路径
 * - 1password:select-folder: 打开文件夹选择对话框
 * - 1password:show-window: 显示配置窗口
 */

import { ipcMain, dialog } from 'electron';
import extensionManager from './extensionManager.js';
import onePasswordWindow from './onePasswordWindow.js';

/**
 * IPC 通道常量定义
 */
const IPC_CHANNELS = {
    GET_1PASSWORD_CONFIG: '1password:get-config',
    SET_1PASSWORD_CONFIG: '1password:set-config',
    VALIDATE_EXTENSION_PATH: '1password:validate-path',
    SELECT_EXTENSION_FOLDER: '1password:select-folder',
    SHOW_WINDOW: '1password:show-window'
};

/**
 * 注册所有 1Password 扩展相关的 IPC 处理器
 */
function registerIpcHandlers() {
    /**
     * 获取 1Password 扩展配置
     * @returns {{enabled: boolean, path: string}}
     */
    ipcMain.handle(IPC_CHANNELS.GET_1PASSWORD_CONFIG, async () => {
        try {
            return extensionManager.getConfig();
        } catch (error) {
            console.error('[1Password IPC] Failed to get config:', error);
            return { enabled: false, path: '' };
        }
    });

    /**
     * 设置 1Password 扩展配置
     * @param {Object} _event - IPC 事件对象
     * @param {{enabled?: boolean, path?: string}} config - 要更新的配置
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    ipcMain.handle(IPC_CHANNELS.SET_1PASSWORD_CONFIG, async (_event, config) => {
        try {
            return await extensionManager.updateConfig(config);
        } catch (error) {
            console.error('[1Password IPC] Failed to set config:', error);
            return { success: false, error: error.message };
        }
    });

    /**
     * 验证扩展路径是否有效
     * @param {Object} _event - IPC 事件对象
     * @param {string} extensionPath - 要验证的扩展路径
     * @returns {Promise<{valid: boolean, error?: string, manifestVersion?: number, extensionName?: string}>}
     */
    ipcMain.handle(IPC_CHANNELS.VALIDATE_EXTENSION_PATH, async (_event, extensionPath) => {
        try {
            return await extensionManager.validateExtensionPath(extensionPath);
        } catch (error) {
            console.error('[1Password IPC] Failed to validate path:', error);
            return { valid: false, error: error.message };
        }
    });

    /**
     * 打开文件夹选择对话框，让用户选择扩展目录
     * @returns {Promise<{canceled: boolean, path?: string}>}
     */
    ipcMain.handle(IPC_CHANNELS.SELECT_EXTENSION_FOLDER, async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: '选择 1Password 扩展目录',
                properties: ['openDirectory'],
                buttonLabel: '选择'
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { canceled: true };
            }

            return {
                canceled: false,
                path: result.filePaths[0]
            };
        } catch (error) {
            console.error('[1Password IPC] Failed to open folder dialog:', error);
            return { canceled: true, error: error.message };
        }
    });

    /**
     * 显示 1Password 配置窗口
     */
    ipcMain.handle(IPC_CHANNELS.SHOW_WINDOW, async () => {
        onePasswordWindow.show();
        return { success: true };
    });

    console.log('[1Password IPC] IPC handlers registered');
}

/**
 * 显示 1Password 配置窗口（供其他模块调用）
 */
function showOnePasswordWindow() {
    onePasswordWindow.show();
}

export { registerIpcHandlers, IPC_CHANNELS, showOnePasswordWindow };
