// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from './types'; // <-- Убедитесь, что IElectronAPI здесь импортируется корректно

// Объявляем интерфейс для API, который будет доступен рендереру
declare global {
    interface Window {
        electronAPI: IElectronAPI;
        // Если вы добавили windowControls, то и его тут:
        // windowControls: {
        //     minimize: () => void;
        //     maximize: () => void;
        //     close: () => void;
        // };
    }
}

contextBridge.exposeInMainWorld('electronAPI', {
    getCurrentCpuLoad: async () => {
        return ipcRenderer.invoke('get-current-cpu-load');
    },
    // НОВАЯ ФУНКЦИЯ IPC ДЛЯ getFullCpuLoadInfo
    getFullCpuLoadInfo: async () => {
        return ipcRenderer.invoke('get-full-cpu-load-info');
    },
} as IElectronAPI);

// Если используете windowControls, добавьте их здесь:
// contextBridge.exposeInMainWorld('windowControls', {
//     minimize: () => ipcRenderer.send('minimize-window'),
//     maximize: () => ipcRenderer.send('maximize-window'),
//     close: () => ipcRenderer.send('close-window'),
// });