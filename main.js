const { app, BrowserWindow } = require("electron");
const createMainWindow = require("./windows/mainWindow.js");
// DockerHandler is already using require
const DockerHandler = require("./ipc/dockerHandler.js");

// Initialize Docker IPC handlers
let a = new DockerHandler();
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
