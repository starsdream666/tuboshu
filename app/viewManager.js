import {WebContentsView, session, shell, dialog, BrowserWindow} from 'electron'
import eventManager from './eventManager.js'
import tbsDbManager from './store/tbsDbManager.js'
import fingerPrint from "./disguise/fingerPrint.js";
import storeManager from "./store/storeManager.js";
import CONS from './constants.js'
import Utility from "./utility/utility.js";
import extensionManager from './extension/extensionManager.js';

class ViewManager {
    constructor() {
        this.views = [];
    }
    addView(item) {
        return this.views.push(item);
    }

    isExist(name) {
        return (this.views.findIndex(item => item.name === name.toLowerCase()) !== -1)
    }

    closeView(name) {
        const index = this.views.findIndex(view =>
            view.name === name.toLowerCase()
        );
        if (index === -1) return false;

        const closedView = this.views.splice(index, 1)[0];
        this.clearView(closedView)

        return true;
    }

    clearView(view){
        if (view.object.webContents?.isDestroyed !== true){
            view.object.webContents.removeAllListeners();
            view.object.webContents.close()
        }
        view.object = null;
    }


    refreshActiveView(){
        const activeView = this.getActiveView();
        //if(!activeView.url.toLowerCase().startsWith("http")) return;
        Utility.loadWithLoading(activeView.object, activeView.url).then(()=>{
            eventManager.emit('set:title', activeView.object.webContents.getTitle());
        }).catch((error)=>{
            console.log('error', error);
            setTimeout(()=> this.refreshActiveView(), 1000)
        })
    }

    getActiveView() {
        return this.views.find(view => view.object.getVisible());
    }

    activeView(name) {
        const timestamp = Date.now();
        for (let i = 0; i < this.views.length; i++) {
            if (this.views[i].name === name.toLowerCase()) {
                this.views[i].time = timestamp;
                this.views[i].object.setVisible(true)
                this.views[i].object.webContents.focus();
                eventManager.emit('set:title', this.views[i].object.webContents.getTitle());
            }else{
                this.views[i].object.setVisible(false)
            }
        }
    }

    createView(url, name, source) {
        const {fingerprint, headers} = fingerPrint.getFinger();
        const partitionName = 'persist:' + name;
        const mySession = session.fromPartition(partitionName);

        const isHttpAddr = url.toLowerCase().startsWith("http");
        const isFileAddr = url.toLowerCase().startsWith("file:");
        const preloadjs = Utility.selectAppropriatePreload(url);

        const unique = Date.now();
        const args = {source, name, unique, fingerprint};

        const view = new WebContentsView({
            webPreferences: {
                sandbox: true,
                webSecurity: !isFileAddr, // 对 file:// 协议禁用 webSecurity 以支持 ES 模块
                nodeIntegration: false,
                contextIsolation: true,
                dnsPrefetch: false,
                partition: partitionName,
                preload: preloadjs,
                additionalArguments: [`--params=${JSON.stringify(args)}`]
            }
        })

        if(isHttpAddr){
            Utility.alterRequestHeader(view, headers)
            Utility.alterResponseHeader(view)
            Utility.loadExtensions(view).finally()
            
            // 加载 1Password 扩展（不阻塞视图创建）
            extensionManager.load1PasswordExtension(view.webContents.session)
                .catch(error => {
                    console.error('[1Password] Error loading extension:', error);
                });
        }

        view.webContents.setZoomLevel(0)
        this.renderProcessGone(view);
        this.injectJsCode(view, name);
        this.setProxy(mySession, name)
        this.handleBasicAuth(view)
        this.handleCredentialURLRedirect(view, url)

        Utility.loadWithLoading(view, url).then(()=>{
            eventManager.emit('set:title', view.webContents.getTitle());
        })

        if(storeManager.getSetting('isOpenDevTools')){
            view.webContents.openDevTools({mode: 'right',activate: true})
        }

        view.webContents.setWindowOpenHandler((details) => {
            if(Utility.isMainDomainEqual(details.url, url)){
                view.webContents.send('open:window', details.url)
                return { action: 'deny' };
            }

            if(storeManager.getSetting('howLinkOpenMethod') === "tuboshu"){
                return {
                    action: 'allow',
                    overrideBrowserWindowOptions: {autoHideMenuBar: true}
                };
            }

            shell.openExternal(details.url).finally();
            return { action: 'deny' };
        })

        const viewItem = {
            name: name.toLowerCase(),
            url: url.toLowerCase(),
            time: unique,
            unique:unique,
            object: view
        }

        this.views.forEach(view => view.object.setVisible(false))
        this.addView(viewItem)
        eventManager.emit('layout:resize', {view: viewItem});

        return viewItem;
    }

    createMultiView(url, name) {
        return this.createView(url, name, CONS.APP.VIEW_TYPE.MULTI)
    }
    createNewView(url, name) {
        if (this.isExist(name)) {
            const activeView = this.getActiveView();
            this.activeView(name);

            if(activeView?.name === name || CONS.APP.CLOSE_SITE_NAME === name){
                this.refreshActiveView();
                return true;
            }
            return true;
        }
        this.createView(url, name, CONS.APP.VIEW_TYPE.SINGLE)
    }

    injectJsCode(view, name){
        view.webContents.on('dom-ready',async ()=>{
            
            const site = tbsDbManager.getSite(name);
            if(site && Object.hasOwn(site,'jsCode') && site.jsCode.length > 0){
                const code = Utility.appendJsCode(JSON.stringify(site.jsCode))
                await view.webContents.executeJavaScript(code);
            }
        })
    }

    setProxy(mySession, name) {
        const site = tbsDbManager.getSite(name);
        if(site && Object.hasOwn(site,'proxy') && site.proxy.length > 10){
            mySession.setProxy({proxyRules: site.proxy,});
        }
    }

    renderProcessGone(view){
        view.webContents.on('render-process-gone', (event, details) => {
            console.error('The rendering process has crashed:', details.reason);
            if (!view.webContents.isDestroyed()) view.webContents.reload();
        });
    }

    handleBasicAuth(view) {
        view.webContents.session.on('login', (event, webContents, details, auth) => {
            event.preventDefault();
            
            // 获取主窗口用于显示认证对话框
            const mainWindow = BrowserWindow.getFocusedWindow();
            
            if (!mainWindow) {
                auth.cancel();
                return;
            }
            
            dialog.showMessageBox(mainWindow, {
                type: 'question',
                title: '需要身份验证',
                message: `服务器 ${details.host} 需要身份验证`,
                detail: `请输入用户名和密码来访问 ${details.realm || '该资源'}`,
                buttons: ['取消', '继续'],
                defaultId: 1,
                cancelId: 0
            }).then(result => {
                if (result.response === 1) {
                    // 显示输入对话框获取用户名
                    dialog.showInputBox(mainWindow, {
                        title: '用户名',
                        label: '请输入用户名:',
                        type: 'text'
                    }).then(usernameResult => {
                        if (usernameResult.canceled) {
                            auth.cancel();
                            return;
                        }
                        
                        const username = usernameResult.text;
                        
                        // 显示输入对话框获取密码
                        dialog.showInputBox(mainWindow, {
                            title: '密码',
                            label: '请输入密码:',
                            type: 'password'
                        }).then(passwordResult => {
                            if (passwordResult.canceled) {
                                auth.cancel();
                                return;
                            }
                            
                            const password = passwordResult.text;
                            auth.login(username, password);
                        });
                    });
                } else {
                    auth.cancel();
                }
            });
        });
    }

    handleCredentialURLRedirect(view, originalUrl) {
        // 检测URL中是否包含用户名:密码格式
        const urlPattern = /^(https?:\/\/)([^:@]+):([^@]+)@(.+)$/;
        const match = originalUrl.match(urlPattern);
        
        if (!match) {
            return; // URL中没有凭证，无需处理
        }
        
        const protocol = match[1];
        const cleanUrl = protocol + match[4];
        let redirected = false;
        
        // 监听页面加载完成事件，在认证成功后重定向到清理后的URL
        const onDidFinishLoad = () => {
            if (redirected) return;
            
            const currentUrl = view.webContents.getURL();
            // 如果当前URL仍然包含凭证，说明需要重定向
            if (currentUrl.includes('@') && currentUrl.match(urlPattern)) {
                redirected = true;
                // 延迟一小段时间确保认证已完成
                setTimeout(() => {
                    view.webContents.loadURL(cleanUrl).catch(err => {
                        console.error('重定向到清理URL失败:', err);
                    });
                }, 300);
            } else if (!currentUrl.includes('@')) {
                // 已经是清理后的URL，移除监听器
                view.webContents.removeListener('did-finish-load', onDidFinishLoad);
            }
        };
        
        view.webContents.on('did-finish-load', onDidFinishLoad);
    }
}

export default new ViewManager();