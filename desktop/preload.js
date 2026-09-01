const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petfitAPI', {
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (key) => ipcRenderer.invoke('save-api-key', key)
});
