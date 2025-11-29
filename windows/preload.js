const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('docker', {
  checkInstalled: () => ipcRenderer.invoke('docker:check-installed'),

  checkRunning: () => ipcRenderer.invoke('docker:check-running'),

  start: () => ipcRenderer.invoke('docker:start'),

  checkImage: (imageName) => ipcRenderer.invoke('docker:check-image', imageName),

  pullImage: (imageName) => ipcRenderer.invoke('docker:pull-image', imageName),

  onPullProgress: (callback) => {
    ipcRenderer.on('docker:pull-progress', (event, data) => callback(data));
  },

  some: "this is working",
  removePullProgressListener: () => {
    ipcRenderer.removeAllListeners('docker:pull-progress');
  }
});
