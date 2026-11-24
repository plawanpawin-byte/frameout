'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('host', {
  openFiles: (opts) => ipcRenderer.invoke('file:open', opts),
  saveFile: (opts) => ipcRenderer.invoke('file:save', opts),
  writeFile: (id, data) => ipcRenderer.invoke('file:write', id, data),
  readFile: (id) => ipcRenderer.invoke('file:read', id),
  folders: {
    list: () => ipcRenderer.invoke('folders:list'),
    create: (n) => ipcRenderer.invoke('folders:create', n),
    add: () => ipcRenderer.invoke('folders:add'),
    remove: (p) => ipcRenderer.invoke('folders:remove', p),
    files: (k) => ipcRenderer.invoke('folders:files', k),
    import: (k) => ipcRenderer.invoke('folders:import', k),
    save: (k, n, d, o) => ipcRenderer.invoke('folders:save', k, n, d, !!o),
    del: (k, n) => ipcRenderer.invoke('folders:delete', k, n),
    open: (k) => ipcRenderer.invoke('folders:open', k),
  },
  info: () => ipcRenderer.invoke('app:info'),
  // before the close question: true when the unsaved changes could not be kept in Recent (sync so it arrives first)
  closeNote: (lost) => ipcRenderer.sendSync('close:note', !!lost),
  
});
