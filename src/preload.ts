
import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from './types'; 


declare global {
    interface Window {
        electronAPI: IElectronAPI;
     
    }
}

contextBridge.exposeInMainWorld('electronAPI', {
    getCurrentCpuLoad: async () => {
        return ipcRenderer.invoke('get-current-cpu-load');
    },

    getFullCpuLoadInfo: async () => {
        return ipcRenderer.invoke('get-full-cpu-load-info');
    },
} as IElectronAPI);

