const { ipcMain } = require('electron');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DockerHandler {
  constructor() {
    this.setupHandlers();
  }

  setupHandlers() {
    ipcMain.handle('docker:check-installed', async () => {
      try {
        await execAsync('docker --version');
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Docker is not installed' };
      }
    });

    ipcMain.handle('docker:check-running', async () => {
      try {
        await execAsync('docker info');
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Docker is not running' };
      }
    });

    ipcMain.handle('docker:start', async () => {
      try {
        const platform = process.platform;
        let command;

        if (platform === 'darwin') {
          command = 'open -a Docker';
        } else if (platform === 'win32') {
          command = 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"';
        } else {
          command = 'sudo systemctl start docker';
        }

        await execAsync(command);

        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await execAsync('docker info');
            return { success: true };
          } catch (e) { }
        }

        return { success: false, error: 'Docker failed to start in time' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('docker:check-image', async (event, imageName = 'ubuntu:latest') => {
      try {
        const { stdout } = await execAsync(`docker images ${imageName} --format "{{.Repository}}:{{.Tag}}"`);
        const hasImage = stdout.trim().length > 0;
        return { success: true, hasImage };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('docker:pull-image', async (event, imageName = 'ubuntu:latest') => {
      return new Promise((resolve) => {
        const child = exec(`docker pull ${imageName}`);

        child.stdout.on('data', (data) => {
          const output = data.toString();
          const progressMatch = output.match(/(\d+)%/);
          if (progressMatch) {
            const progress = parseInt(progressMatch[1]);
            event.sender.send('docker:pull-progress', {
              progress,
              message: output.trim()
            });
          }
        });

        child.stderr.on('data', (data) => {
          event.sender.send('docker:pull-progress', {
            message: data.toString().trim()
          });
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Failed to pull image' });
          }
        });
      });
    });
  }
}

module.exports = DockerHandler;
