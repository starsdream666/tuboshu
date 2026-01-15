/**
 * Unit tests for ExtensionManager.validateExtensionPath()
 * 
 * Tests validate:
 * - Path existence checking
 * - manifest.json file presence
 * - manifest.json format validation (required fields: name, version, manifest_version)
 * 
 * Requirements: 1.2, 1.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock the storeManager before importing extensionManager
vi.mock('../store/storeManager.js', () => ({
    default: {
        getSetting: vi.fn((key) => {
            if (key === 'is1PasswordEnabled') return 0;
            if (key === 'onePasswordExtensionPath') return '';
            return undefined;
        }),
        updateSetting: vi.fn()
    }
}));

// Import the ExtensionManager class after mocking
const { default: extensionManager } = await import('./extensionManager.js');

describe('ExtensionManager', () => {
    describe('validateExtensionPath', () => {
        let testDir;

        beforeEach(async () => {
            // Create a temporary directory for testing
            testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ext-test-'));
        });

        afterEach(async () => {
            // Clean up temporary directory
            if (testDir) {
                await fs.promises.rm(testDir, { recursive: true, force: true });
            }
        });

        it('should return valid for path with valid manifest', async () => {
            // Create a valid manifest.json
            const manifest = {
                name: 'Test Extension',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.extensionName).toBe('Test Extension');
            expect(result.manifestVersion).toBe(3);
        });

        it('should return invalid for non-existent path', async () => {
            const nonExistentPath = path.join(testDir, 'non-existent-folder');

            const result = await extensionManager.validateExtensionPath(nonExistentPath);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('指定路径不存在');
        });

        it('should return invalid for null path', async () => {
            const result = await extensionManager.validateExtensionPath(null);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('指定路径不存在');
        });

        it('should return invalid for undefined path', async () => {
            const result = await extensionManager.validateExtensionPath(undefined);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('指定路径不存在');
        });

        it('should return invalid for empty string path', async () => {
            const result = await extensionManager.validateExtensionPath('');

            expect(result.valid).toBe(false);
            expect(result.error).toBe('指定路径不存在');
        });

        it('should return invalid for path without manifest.json', async () => {
            // testDir exists but has no manifest.json
            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('未找到有效的扩展清单文件');
        });

        it('should return invalid for path with invalid JSON in manifest.json', async () => {
            // Create an invalid manifest.json
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                'not valid json {'
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for manifest missing name field', async () => {
            const manifest = {
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for manifest missing version field', async () => {
            const manifest = {
                name: 'Test Extension',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for manifest missing manifest_version field', async () => {
            const manifest = {
                name: 'Test Extension',
                version: '1.0.0'
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for manifest with empty name', async () => {
            const manifest = {
                name: '',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for manifest with empty version', async () => {
            const manifest = {
                name: 'Test Extension',
                version: '',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for manifest with non-integer manifest_version', async () => {
            const manifest = {
                name: 'Test Extension',
                version: '1.0.0',
                manifest_version: '3'  // string instead of number
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('扩展清单文件格式无效');
        });

        it('should return invalid for file path instead of directory', async () => {
            // Create a file instead of directory
            const filePath = path.join(testDir, 'not-a-directory');
            await fs.promises.writeFile(filePath, 'content');

            const result = await extensionManager.validateExtensionPath(filePath);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('指定路径不存在');
        });

        it('should handle manifest_version 2 (MV2)', async () => {
            const manifest = {
                name: '1Password Extension',
                version: '2.3.8',
                manifest_version: 2
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(true);
            expect(result.manifestVersion).toBe(2);
        });

        it('should handle manifest_version 3 (MV3)', async () => {
            const manifest = {
                name: '1Password Extension',
                version: '2.3.8',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            const result = await extensionManager.validateExtensionPath(testDir);

            expect(result.valid).toBe(true);
            expect(result.manifestVersion).toBe(3);
        });
    });

    describe('load1PasswordExtension', () => {
        let testDir;
        let mockStoreManager;

        beforeEach(async () => {
            // Create a temporary directory for testing
            testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ext-test-'));
            
            // Clear loaded sessions before each test
            extensionManager.clearLoadedSessions();
            
            // Get the mocked storeManager
            mockStoreManager = (await import('../store/storeManager.js')).default;
        });

        afterEach(async () => {
            // Clean up temporary directory
            if (testDir) {
                await fs.promises.rm(testDir, { recursive: true, force: true });
            }
            vi.clearAllMocks();
        });

        it('should skip loading when extension is disabled', async () => {
            // Mock config: disabled
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 0;
                if (key === 'onePasswordExtensionPath') return testDir;
                return undefined;
            });

            const mockSession = {
                getStoragePath: () => 'test-partition',
                extensions: {
                    loadExtension: vi.fn()
                }
            };

            const result = await extensionManager.load1PasswordExtension(mockSession);

            expect(result.success).toBe(true);
            expect(result.skipped).toBe(true);
            expect(result.reason).toBe('disabled');
            expect(mockSession.extensions.loadExtension).not.toHaveBeenCalled();
        });

        it('should return error for invalid extension path', async () => {
            // Mock config: enabled but invalid path
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 1;
                if (key === 'onePasswordExtensionPath') return '/non/existent/path';
                return undefined;
            });

            const mockSession = {
                getStoragePath: () => 'test-partition',
                extensions: {
                    loadExtension: vi.fn()
                }
            };

            const result = await extensionManager.load1PasswordExtension(mockSession);

            expect(result.success).toBe(false);
            expect(result.error).toBe('指定路径不存在');
            expect(mockSession.extensions.loadExtension).not.toHaveBeenCalled();
        });

        it('should skip loading when extension is already loaded (idempotence)', async () => {
            // Create valid manifest
            const manifest = {
                name: '1Password Extension',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            // Mock config: enabled with valid path
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 1;
                if (key === 'onePasswordExtensionPath') return testDir;
                return undefined;
            });

            const mockSession = {
                getStoragePath: () => 'test-partition',
                extensions: {
                    loadExtension: vi.fn().mockResolvedValue({
                        id: 'test-extension-id',
                        name: '1Password Extension'
                    })
                }
            };

            // First call should load
            const result1 = await extensionManager.load1PasswordExtension(mockSession);
            expect(result1.success).toBe(true);
            expect(result1.extensionId).toBe('test-extension-id');
            expect(mockSession.extensions.loadExtension).toHaveBeenCalledTimes(1);

            // Second call should skip (already loaded)
            const result2 = await extensionManager.load1PasswordExtension(mockSession);
            expect(result2.success).toBe(true);
            expect(result2.skipped).toBe(true);
            expect(result2.reason).toBe('already_loaded');
            expect(mockSession.extensions.loadExtension).toHaveBeenCalledTimes(1); // Still only 1 call
        });

        it('should successfully load extension with valid config', async () => {
            // Create valid manifest
            const manifest = {
                name: '1Password Extension',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            // Mock config: enabled with valid path
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 1;
                if (key === 'onePasswordExtensionPath') return testDir;
                return undefined;
            });

            const mockSession = {
                getStoragePath: () => 'test-partition',
                extensions: {
                    loadExtension: vi.fn().mockResolvedValue({
                        id: 'test-extension-id',
                        name: '1Password Extension'
                    })
                }
            };

            const result = await extensionManager.load1PasswordExtension(mockSession);

            expect(result.success).toBe(true);
            expect(result.extensionId).toBe('test-extension-id');
            expect(mockSession.extensions.loadExtension).toHaveBeenCalledWith(testDir, {
                allowFileAccess: true
            });
        });

        it('should handle Electron API errors gracefully (error resilience)', async () => {
            // Create valid manifest
            const manifest = {
                name: '1Password Extension',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            // Mock config: enabled with valid path
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 1;
                if (key === 'onePasswordExtensionPath') return testDir;
                return undefined;
            });

            const mockSession = {
                getStoragePath: () => 'test-partition',
                extensions: {
                    loadExtension: vi.fn().mockRejectedValue(new Error('Electron API failure'))
                }
            };

            const result = await extensionManager.load1PasswordExtension(mockSession);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Electron API failure');
        });

        it('should use default partition key when getStoragePath is not available', async () => {
            // Create valid manifest
            const manifest = {
                name: '1Password Extension',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            // Mock config: enabled with valid path
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 1;
                if (key === 'onePasswordExtensionPath') return testDir;
                return undefined;
            });

            const mockSession = {
                // No getStoragePath method
                extensions: {
                    loadExtension: vi.fn().mockResolvedValue({
                        id: 'test-extension-id',
                        name: '1Password Extension'
                    })
                }
            };

            const result = await extensionManager.load1PasswordExtension(mockSession);

            expect(result.success).toBe(true);
            expect(result.extensionId).toBe('test-extension-id');
        });

        it('should load extension for different session partitions independently', async () => {
            // Create valid manifest
            const manifest = {
                name: '1Password Extension',
                version: '1.0.0',
                manifest_version: 3
            };
            await fs.promises.writeFile(
                path.join(testDir, 'manifest.json'),
                JSON.stringify(manifest)
            );

            // Mock config: enabled with valid path
            mockStoreManager.getSetting.mockImplementation((key) => {
                if (key === 'is1PasswordEnabled') return 1;
                if (key === 'onePasswordExtensionPath') return testDir;
                return undefined;
            });

            const mockSession1 = {
                getStoragePath: () => 'partition-1',
                extensions: {
                    loadExtension: vi.fn().mockResolvedValue({
                        id: 'ext-id-1',
                        name: '1Password Extension'
                    })
                }
            };

            const mockSession2 = {
                getStoragePath: () => 'partition-2',
                extensions: {
                    loadExtension: vi.fn().mockResolvedValue({
                        id: 'ext-id-2',
                        name: '1Password Extension'
                    })
                }
            };

            // Load for first partition
            const result1 = await extensionManager.load1PasswordExtension(mockSession1);
            expect(result1.success).toBe(true);
            expect(result1.extensionId).toBe('ext-id-1');

            // Load for second partition (should also load, different partition)
            const result2 = await extensionManager.load1PasswordExtension(mockSession2);
            expect(result2.success).toBe(true);
            expect(result2.extensionId).toBe('ext-id-2');

            // Both sessions should have had loadExtension called
            expect(mockSession1.extensions.loadExtension).toHaveBeenCalledTimes(1);
            expect(mockSession2.extensions.loadExtension).toHaveBeenCalledTimes(1);
        });
    });
});
