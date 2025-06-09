// src/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
const path = require('path');

import { getCurrentCpuLoad, getFullCpuLoadInfo } from './modules/cpu'; // <-- НОВЫЙ ИМПОРТ

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

// ОБРАБОТЧИКИ IPC В ГЛАВНОМ ПРОЦЕССЕ
ipcMain.handle('get-current-cpu-load', async () => {
  return getCurrentCpuLoad();
});

// НОВЫЙ ОБРАБОТЧИК ДЛЯ ПОЛНОЙ ИНФОРМАЦИИ О ЦП
ipcMain.handle('get-full-cpu-load-info', async () => {
    return getFullCpuLoadInfo();
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


// src/main.ts
// import { app, BrowserWindow, ipcMain } from 'electron';
// const path = require('path');

// Импортируем наши новые модули


// ... (остальной код)

