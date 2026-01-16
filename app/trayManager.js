import { Tray, Menu, app, shell} from 'electron'
import path from 'path'
import CONS from './constants.js'
import windowManager from './windowManager.js'
import { showOnePasswordWindow } from './extension/extensionIpc.js'

const selfUrl = "https://github.com/deepshit2025/tuboshu";
class TrayManager {
    constructor() {
        if (TrayManager.instance) return TrayManager.instance;
        TrayManager.instance = this;
        this.tray = null;
    }

    createTray() {
        const iconFile = app.isMac ? 'resource/build/mac/icon.png' : 'icon.ico';
        const iconPath = path.join(CONS.APP.PATH, iconFile);

        this.tray = new Tray(iconPath);
        this.tray.setToolTip("土拨鼠");
        this.updateMenu();

        if (app.isMac) {
            this.tray.on('right-click', () => this.tray.popUpContextMenu());
        } else {
            this.tray.on('click', () => this.toggleWindow());
        }
    }

    updateMenu() {
        const contextMenu = Menu.buildFromTemplate([
            { label: '官网', click: () => this.openWebsite(selfUrl) },
            { label: '设置', click: () => this.autoClickSettings() },
            { label: '1Password 配置', click: () => showOnePasswordWindow() },
            { type: 'separator' },
            { label: '显示/隐藏', click: () => this.toggleWindow() },
            { label: '退出', click: () => this.reallyQuitApp() }
        ]);
        this.tray.setContextMenu(contextMenu);
    }


    openWebsite(url){
        shell.openExternal(url).catch(err => {
            console.error('打开链接失败:', err);
        });
    }

    autoClickSettings(){
        let win = windowManager.getWindow();
        if(!win.isVisible()) win.show();

        let menuView = windowManager.getMenuView();
        menuView.webContents.send('auto:click', CONS.SETTING[0]);
    }

    reallyQuitApp() {
        app.isQuitting = true;
        app.quit();
    }

    toggleWindow() {
        const win = windowManager.getWindow();
        if(win.isVisible()){
            win.hide();
            if(app.isMac) app.dock.hide();
        }else{
            win.show();
            if(app.isMac) app.dock.show().catch(err => console.error(err));
        }
    }

    destroyTray() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }
}
export default  new TrayManager();