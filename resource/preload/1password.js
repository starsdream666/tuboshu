const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('onePasswordApi', {
    getConfig: () => ipcRenderer.invoke('1password:get-config'),
    setConfig: (config) => ipcRenderer.invoke('1password:set-config', config),
    validatePath: (path) => ipcRenderer.invoke('1password:validate-path', path),
    selectFolder: () => ipcRenderer.invoke('1password:select-folder'),
});
