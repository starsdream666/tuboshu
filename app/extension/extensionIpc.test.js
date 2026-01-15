/**
 * Unit tests for extensionIpc.js IPC handlers
 * 
 * Tests validate:
 * - 1password:get-config handler returns config from extensionManager
 * - 1password:set-config handler updates config via extensionManager
 * - 1password:validate-path handler validates paths via extensionManager
 * - 1password:select-folder handler opens folder dialog
 * 
 * Requirements: 5.2, 5.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock electron modules
vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn()
    },
    dialog: {
        showOpenDialog: vi.fn()
    }
}));

// Mock extensionManager
vi.mock('./extensionManager.js', () => ({
    default: {
        getConfig: vi.fn(),
        updateConfig: vi.fn(),
        validateExtensionPath: vi.fn()
    }
}));

// Import after mocking
const { ipcMain, dialog } = await import('electron');
const { default: extensionManager } = await import('./extensionManager.js');
const { registerIpcHandlers, IPC_CHANNELS } = await import('./extensionIpc.js');

describe('extensionIpc', () => {
    let registeredHandlers;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();
        
        // Capture registered handlers
        registeredHandlers = {};
        ipcMain.handle.mockImplementation((channel, handler) => {
            registeredHandlers[channel] = handler;
        });
        
        // Register handlers
        registerIpcHandlers();
    });

    describe('IPC_CHANNELS', () => {
        it('should export correct channel names', () => {
            expect(IPC_CHANNELS.GET_1PASSWORD_CONFIG).toBe('1password:get-config');
            expect(IPC_CHANNELS.SET_1PASSWORD_CONFIG).toBe('1password:set-config');
            expect(IPC_CHANNELS.VALIDATE_EXTENSION_PATH).toBe('1password:validate-path');
            expect(IPC_CHANNELS.SELECT_EXTENSION_FOLDER).toBe('1password:select-folder');
        });
    });

    describe('registerIpcHandlers', () => {
        it('should register all four IPC handlers', () => {
            expect(ipcMain.handle).toHaveBeenCalledTimes(4);
            expect(registeredHandlers['1password:get-config']).toBeDefined();
            expect(registeredHandlers['1password:set-config']).toBeDefined();
            expect(registeredHandlers['1password:validate-path']).toBeDefined();
            expect(registeredHandlers['1password:select-folder']).toBeDefined();
        });
    });

    describe('1password:get-config handler', () => {
        it('should return config from extensionManager', async () => {
            const mockConfig = { enabled: true, path: '/test/path' };
            extensionManager.getConfig.mockReturnValue(mockConfig);

            const handler = registeredHandlers['1password:get-config'];
            const result = await handler();

            expect(extensionManager.getConfig).toHaveBeenCalled();
            expect(result).toEqual(mockConfig);
        });

        it('should return default config on error', async () => {
            extensionManager.getConfig.mockImplementation(() => {
                throw new Error('Test error');
            });

            const handler = registeredHandlers['1password:get-config'];
            const result = await handler();

            expect(result).toEqual({ enabled: false, path: '' });
        });
    });

    describe('1password:set-config handler', () => {
        it('should update config via extensionManager', async () => {
            const mockConfig = { enabled: true, path: '/new/path' };
            extensionManager.updateConfig.mockResolvedValue({ success: true });

            const handler = registeredHandlers['1password:set-config'];
            const result = await handler({}, mockConfig);

            expect(extensionManager.updateConfig).toHaveBeenCalledWith(mockConfig);
            expect(result).toEqual({ success: true });
        });

        it('should return error on failure', async () => {
            extensionManager.updateConfig.mockRejectedValue(new Error('Update failed'));

            const handler = registeredHandlers['1password:set-config'];
            const result = await handler({}, { enabled: true });

            expect(result).toEqual({ success: false, error: 'Update failed' });
        });

        it('should handle partial config updates', async () => {
            extensionManager.updateConfig.mockResolvedValue({ success: true });

            const handler = registeredHandlers['1password:set-config'];
            
            // Update only enabled
            await handler({}, { enabled: false });
            expect(extensionManager.updateConfig).toHaveBeenCalledWith({ enabled: false });

            // Update only path
            await handler({}, { path: '/another/path' });
            expect(extensionManager.updateConfig).toHaveBeenCalledWith({ path: '/another/path' });
        });
    });

    describe('1password:validate-path handler', () => {
        it('should validate path via extensionManager', async () => {
            const mockResult = { valid: true, extensionName: 'Test', manifestVersion: 3 };
            extensionManager.validateExtensionPath.mockResolvedValue(mockResult);

            const handler = registeredHandlers['1password:validate-path'];
            const result = await handler({}, '/test/extension/path');

            expect(extensionManager.validateExtensionPath).toHaveBeenCalledWith('/test/extension/path');
            expect(result).toEqual(mockResult);
        });

        it('should return invalid result for non-existent path', async () => {
            const mockResult = { valid: false, error: '指定路径不存在' };
            extensionManager.validateExtensionPath.mockResolvedValue(mockResult);

            const handler = registeredHandlers['1password:validate-path'];
            const result = await handler({}, '/non/existent/path');

            expect(result).toEqual(mockResult);
        });

        it('should return error on exception', async () => {
            extensionManager.validateExtensionPath.mockRejectedValue(new Error('Validation error'));

            const handler = registeredHandlers['1password:validate-path'];
            const result = await handler({}, '/test/path');

            expect(result).toEqual({ valid: false, error: 'Validation error' });
        });
    });

    describe('1password:select-folder handler', () => {
        it('should open folder dialog and return selected path', async () => {
            dialog.showOpenDialog.mockResolvedValue({
                canceled: false,
                filePaths: ['/selected/folder/path']
            });

            const handler = registeredHandlers['1password:select-folder'];
            const result = await handler();

            expect(dialog.showOpenDialog).toHaveBeenCalledWith({
                title: '选择 1Password 扩展目录',
                properties: ['openDirectory'],
                buttonLabel: '选择'
            });
            expect(result).toEqual({
                canceled: false,
                path: '/selected/folder/path'
            });
        });

        it('should return canceled when user cancels dialog', async () => {
            dialog.showOpenDialog.mockResolvedValue({
                canceled: true,
                filePaths: []
            });

            const handler = registeredHandlers['1password:select-folder'];
            const result = await handler();

            expect(result).toEqual({ canceled: true });
        });

        it('should return canceled when no path selected', async () => {
            dialog.showOpenDialog.mockResolvedValue({
                canceled: false,
                filePaths: []
            });

            const handler = registeredHandlers['1password:select-folder'];
            const result = await handler();

            expect(result).toEqual({ canceled: true });
        });

        it('should handle dialog error gracefully', async () => {
            dialog.showOpenDialog.mockRejectedValue(new Error('Dialog error'));

            const handler = registeredHandlers['1password:select-folder'];
            const result = await handler();

            expect(result).toEqual({ canceled: true, error: 'Dialog error' });
        });
    });
});
