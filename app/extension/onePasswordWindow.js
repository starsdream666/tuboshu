/**
 * 1Password 配置悬浮窗管理器
 */

import { BrowserWindow } from 'electron';
import path from 'path';
import CONS from '../constants.js';

class OnePasswordWindow {
    constructor() {
        this.window = null;
    }

    /**
     * 显示 1Password 配置窗口
     */
    show() {
        if (this.window && !this.window.isDestroyed()) {
            this.window.focus();
            return;
        }

        this.window = new BrowserWindow({
            width: 420,
            height: 380,
            resizable: false,
            minimizable: false,
            maximizable: false,
            alwaysOnTop: true,
            frame: true,
            title: '1Password 扩展配置',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(CONS.APP.PATH, 'resource/preload/1password.js')
            }
        });

        const htmlPath = path.join(CONS.APP.PATH, 'gui/1password.html');
        this.window.loadFile(htmlPath);

        this.window.on('closed', () => {
            this.window = null;
        });

        // 隐藏菜单栏
        this.window.setMenuBarVisibility(false);
    }

    /**
     * 关闭窗口
     */
    close() {
        if (this.window && !this.window.isDestroyed()) {
            this.window.close();
            this.window = null;
        }
    }

    /**
     * 检查窗口是否打开
     */
    isOpen() {
        return this.window && !this.window.isDestroyed();
    }
}

export default new OnePasswordWindow();
