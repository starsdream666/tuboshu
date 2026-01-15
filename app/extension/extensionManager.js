/**
 * ExtensionManager - 管理 1Password 浏览器扩展的加载和配置
 * 
 * 负责:
 * - 管理扩展配置（启用状态、扩展路径）
 * - 与 StoreManager 集成进行配置持久化
 * - 跟踪已加载扩展的 session
 * - 验证扩展路径有效性
 */

import storeManager from '../store/storeManager.js';
import fs from 'fs';
import path from 'path';

class ExtensionManager {
    constructor() {
        /**
         * 记录已加载扩展的 session partition
         * @type {Set<string>}
         */
        this.loadedSessions = new Set();
    }

    /**
     * 获取扩展配置
     * @returns {{enabled: boolean, path: string}}
     */
    getConfig() {
        const enabled = storeManager.getSetting('is1PasswordEnabled');
        const path = storeManager.getSetting('onePasswordExtensionPath');
        
        return {
            enabled: Boolean(enabled),
            path: path || ''
        };
    }

    /**
     * 更新扩展配置
     * @param {{enabled?: boolean, path?: string}} config - 要更新的配置项
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateConfig(config) {
        try {
            if (config.enabled !== undefined) {
                storeManager.updateSetting({
                    name: 'is1PasswordEnabled',
                    value: config.enabled ? 1 : 0
                });
            }
            
            if (config.path !== undefined) {
                storeManager.updateSetting({
                    name: 'onePasswordExtensionPath',
                    value: config.path
                });
            }
            
            console.log('[1Password] Configuration updated:', config);
            return { success: true };
        } catch (error) {
            console.error('[1Password] Failed to update configuration:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 检查 session 是否已加载扩展
     * @param {string} partitionName - session partition 名称
     * @returns {boolean}
     */
    isExtensionLoaded(partitionName) {
        return this.loadedSessions.has(partitionName);
    }

    /**
     * 标记 session 已加载扩展
     * @param {string} partitionName - session partition 名称
     */
    markExtensionLoaded(partitionName) {
        this.loadedSessions.add(partitionName);
    }

    /**
     * 清除已加载扩展的记录（用于测试或重置）
     */
    clearLoadedSessions() {
        this.loadedSessions.clear();
    }

    /**
     * 为指定 session 加载 1Password 扩展
     * @param {Session} session - Electron session 对象
     * @returns {Promise<{success: boolean, error?: string, skipped?: boolean, reason?: string, extensionId?: string}>}
     */
    async load1PasswordExtension(session) {
        try {
            const config = this.getConfig();
            
            // 检查是否启用
            if (!config.enabled) {
                return { success: true, skipped: true, reason: 'disabled' };
            }
            
            // 验证路径
            const validation = await this.validateExtensionPath(config.path);
            if (!validation.valid) {
                console.warn(`[1Password] Invalid extension path: ${validation.error}`);
                return { success: false, error: validation.error };
            }
            
            // 检查是否已加载（幂等性检查）
            const partitionKey = session.getStoragePath?.() || 'default';
            if (this.loadedSessions.has(partitionKey)) {
                return { success: true, skipped: true, reason: 'already_loaded' };
            }
            
            // 加载扩展
            const extension = await session.extensions.loadExtension(config.path, {
                allowFileAccess: true
            });
            
            this.loadedSessions.add(partitionKey);
            console.log(`[1Password] Extension loaded: ${extension.name} (${extension.id})`);
            
            return { success: true, extensionId: extension.id };
            
        } catch (error) {
            console.error(`[1Password] Failed to load extension:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 验证扩展路径是否有效
     * @param {string} extensionPath - 扩展目录路径
     * @returns {Promise<{valid: boolean, error?: string, manifestVersion?: number, extensionName?: string}>}
     */
    async validateExtensionPath(extensionPath) {
        try {
            // 检查路径是否提供
            if (!extensionPath || typeof extensionPath !== 'string') {
                return { valid: false, error: '指定路径不存在' };
            }

            // 检查路径是否存在
            try {
                await fs.promises.access(extensionPath, fs.constants.F_OK);
            } catch {
                return { valid: false, error: '指定路径不存在' };
            }

            // 检查路径是否为目录
            const stats = await fs.promises.stat(extensionPath);
            if (!stats.isDirectory()) {
                return { valid: false, error: '指定路径不存在' };
            }

            // 检查 manifest.json 是否存在
            const manifestPath = path.join(extensionPath, 'manifest.json');
            try {
                await fs.promises.access(manifestPath, fs.constants.F_OK);
            } catch {
                return { valid: false, error: '未找到有效的扩展清单文件' };
            }

            // 读取并解析 manifest.json
            let manifest;
            try {
                const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
                manifest = JSON.parse(manifestContent);
            } catch (parseError) {
                return { valid: false, error: '扩展清单文件格式无效' };
            }

            // 验证 manifest.json 必需字段
            const requiredFields = ['name', 'version', 'manifest_version'];
            for (const field of requiredFields) {
                if (manifest[field] === undefined || manifest[field] === null) {
                    return { valid: false, error: '扩展清单文件格式无效' };
                }
            }

            // 验证字段类型
            if (typeof manifest.name !== 'string' || manifest.name.trim() === '') {
                return { valid: false, error: '扩展清单文件格式无效' };
            }
            if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
                return { valid: false, error: '扩展清单文件格式无效' };
            }
            if (typeof manifest.manifest_version !== 'number' || !Number.isInteger(manifest.manifest_version)) {
                return { valid: false, error: '扩展清单文件格式无效' };
            }

            // 验证成功
            return {
                valid: true,
                manifestVersion: manifest.manifest_version,
                extensionName: manifest.name
            };

        } catch (error) {
            console.error('[1Password] Error validating extension path:', error);
            return { valid: false, error: '指定路径不存在' };
        }
    }
}

// 导出单例实例
export default new ExtensionManager();
