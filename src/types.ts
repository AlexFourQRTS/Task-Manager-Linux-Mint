
export interface IElectronAPI {
  
    getCurrentCpuLoad: () => Promise<number>;
}



import { IFullCpuLoadInfo } from './modules/cpu'; 

export interface IElectronAPI {
    getCurrentCpuLoad: () => Promise<number>;
    getFullCpuLoadInfo: () => Promise<IFullCpuLoadInfo>; 
    
}

