import { contextBridge, ipcRenderer } from 'electron';
// Обновите этот импорт, если вы переименовали файл с модулем
// import { getCurrentCpuLoad, getSystemOverviewInfo } from './modules/systemInfo'; // Или './modules/cpu' если не переименовали

contextBridge.exposeInMainWorld('electronAPI', {
    getCurrentCpuLoad: () => ipcRenderer.invoke('get-current-cpu-load'), // Если still needed
    getSystemOverviewInfo: () => ipcRenderer.invoke('get-system-overview-info'), // Новая функция
});

// В вашем main.ts также нужно будет обновить обработчик:
// ipcMain.handle('get-system-overview-info', async () => { return getSystemOverviewInfo(); });