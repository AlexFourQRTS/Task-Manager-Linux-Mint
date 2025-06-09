// src/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
const path = require('path');

// Убедитесь, что импорт правильный (новое имя функции и файла)
import { getCurrentCpuLoad, getSystemOverviewInfo } from "./modules/cpu/index"

if (process.platform === 'win32') {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
  // mainWindow.webContents.openDevTools();
};

// ОБНОВЛЕННЫЕ ОБРАБОТЧИКИ IPC В ГЛАВНОМ ПРОЦЕССЕ
ipcMain.handle('get-current-cpu-load', async () => { // Если вы еще используете эту функцию где-то отдельно
  return getCurrentCpuLoad();
});

// НОВЫЙ ОБРАБОТЧИК ДЛЯ ПОЛНОЙ ИНФОРМАЦИИ О СИСТЕМЕ
ipcMain.handle('get-system-overview-info', async () => {
    return getSystemOverviewInfo();
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});