// // src/types.ts
// import { Systeminformation } from 'systeminformation';

// /**
//  * Интерфейс для данных процесса, как они будут отображаться в UI.
//  */
// export interface ProcessData {
//     pid: number;
//     name: string;
//     cpu: number;
//     mem: number;
//     disk: string; // Пока оставим string, но для сортировки или более точных данных потребуется number
//     network: string; // Пока оставим string, но для сортировки или более точных данных потребуется number
//     // Дополнительные поля, если нужны:
//     // path?: string; // Путь к исполняемому файлу
//     // command?: string; // Полная команда запуска
//     // parentPid?: number; // Родительский PID
//     // user?: string; // Пользователь, от которого запущен процесс
// }

// /**
//  * Интерфейс для API, который будет доступен рендереру через `window.electronAPI`.
//  */
// export interface IElectronAPI {
//     getProcesses: () => Promise<ProcessData[]>;
//     getSystemInfo: () => Promise<{
//         cpuLoad: string;
//         cpuSpeed: string;
//         cpuCores: number;
//         memTotal: string;
//         memUsed: string;
//         memAvailable: string;
//         diskRead: string;
//         diskWrite: string;
//         networkRx: string;
//         networkTx: string;
//     }>;
//     killProcess: (pid: number) => Promise<boolean>;

//     // Расширенные функции для других вкладок и детализации:
//     getCpuInfo: () => Promise<{ speed: string, cores: number, manufacturer: string, brand: string }>;
//     getCurrentCpuLoad: () => Promise<number>;
//     getMemoryInfo: () => Promise<{ total: number, used: number, available: number }>;
//     getDiskInfo: () => Promise<Systeminformation.FsSizeData[]>;
//     getDiskStats: () => Promise<Systeminformation.FsStatsData>; // Изменено на FsStatsData
//     getNetworkInterfaces: () => Promise<Systeminformation.NetworkInterfacesData[]>;
//     getNetworkStats: () => Promise<Systeminformation.NetworkStatsData[]>;
//     getStartupPrograms: () => Promise<Systeminformation.ServicesData[]>; // Возвращает службы
//     getUsers: () => Promise<Systeminformation.UsersData[]>;
//     getServices: () => Promise<Systeminformation.ServicesData[]>;
//     getOsInfo: () => Promise<Systeminformation.OsData>;
//     getSystemUptime: () => Promise<number>;
//     getProcessDetails: (pid: number) => Promise<Systeminformation.ProcessesProcessData | null>;
// }

// // -----------------

// // src/types.ts
// import { Systeminformation } from 'systeminformation';

// /**
//  * Интерфейс для данных процесса, как они будут отображаться в UI.
//  */
// export interface ProcessData {
//     pid: number;
//     name: string;
//     cpu: number;
//     mem: number;
//     disk: string; // Пока оставим string
//     network: string; // Пока оставим string
// }

// /**
//  * Расширенный интерфейс для данных программ автозагрузки,
//  * чтобы включить свойства, которые мы хотим отображать,
//  * даже если systeminformation не предоставляет их напрямую для всех платформ.
//  * Это позволит нам явно указывать, какие поля мы ожидаем для UI.
//  */
// export interface StartupProgramData {
//     name: string;
//     pid?: number; // PID может быть не всегда доступен для всех автозагрузочных элементов
//     status: string; // Например, "Запущено", "Остановлено", "Включено", "Выключено"
//     description: string; // Описание программы
//     // Добавьте другие поля по необходимости
// }


// /**
//  * Интерфейс для API, который будет доступен рендереру через `window.electronAPI`.
//  */
// export interface IElectronAPI {
//     getProcesses: () => Promise<ProcessData[]>;
//     getSystemInfo: () => Promise<{
//         cpuLoad: string;
//         cpuSpeed: string;
//         cpuCores: number;
//         memTotal: string;
//         memUsed: string;
//         memAvailable: string;
//         diskRead: string;
//         diskWrite: string;
//         networkRx: string;
//         networkTx: string;
//     }>;
//     killProcess: (pid: number) => Promise<boolean>;

//     // Расширенные функции для других вкладок и детализации:
//     getCpuInfo: () => Promise<{ speed: string, cores: number, manufacturer: string, brand: string }>;
//     getCurrentCpuLoad: () => Promise<number>;
//     getMemoryInfo: () => Promise<{ total: number, used: number, available: number }>;
//     getDiskInfo: () => Promise<Systeminformation.FsSizeData[]>;
//     getDiskStats: () => Promise<Systeminformation.FsStatsData>;
//     getNetworkInterfaces: () => Promise<Systeminformation.NetworkInterfacesData[]>;
//     getNetworkStats: () => Promise<Systeminformation.NetworkStatsData[]>;
//     // Возвращаем более общий StartupProgramData[]
//     getStartupPrograms: () => Promise<StartupProgramData[]>;
//     // Исправлено с UsersData на UserData
//     getUsers: () => Promise<Systeminformation.UserData[]>;
//     getServices: () => Promise<Systeminformation.ServicesData[]>;
//     getOsInfo: () => Promise<Systeminformation.OsData>;
//     getSystemUptime: () => Promise<number>;
//     getProcessDetails: (pid: number) => Promise<Systeminformation.ProcessesProcessData | null>;
// }



// src/types.ts

// Интерфейс для API, который будет доступен рендереру через `window.electronAPI`.
export interface IElectronAPI {
    // Только функция для получения текущей загрузки CPU
    getCurrentCpuLoad: () => Promise<number>;
}

// src/types.ts

import { IFullCpuLoadInfo } from './modules/cpu'; // Импортируем интерфейс

export interface IElectronAPI {
    getCurrentCpuLoad: () => Promise<number>;
    getFullCpuLoadInfo: () => Promise<IFullCpuLoadInfo>; // <-- НОВАЯ ФУНКЦИЯ API
    // ... здесь будут другие функции для памяти, дисков и т.д.
}

// ... другие интерфейсы, если они у вас есть