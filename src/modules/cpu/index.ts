// src/modules/cpu/index.ts
import si from 'systeminformation';

/**
 * Интерфейс для детальной информации о загрузке CPU и процессах.
 */
export interface IFullCpuLoadInfo {
    currentLoad: number; // Общая загрузка ЦП в процентах
    cpuCount: number;    // Общее количество логических процессоров/потоков
    processes: Array<{   // Список процессов
        pid: number;
        name: string;
        cpuPercent: number; // Процент загрузки ЦП этим процессом
        memPercent: number; // Процент использования памяти этим процессом
    }>;
}

/**
 * Получает текущую общую загрузку CPU.
 * @returns Процент загрузки CPU.
 */
export async function getCurrentCpuLoad(): Promise<number> {
    try {
        const cpu = await si.currentLoad();
        return parseFloat(cpu.currentLoad.toFixed(1));
    } catch (error) {
        console.error('Error getting current CPU load from module:', error);
        return 0;
    }
}

/**
 * Получает детальную информацию о загрузке CPU, включая количество ядер и загрузку по процессам.
 * @returns Детальная информация о загрузке CPU.
 */
export async function getFullCpuLoadInfo(): Promise<IFullCpuLoadInfo> {
    try {
        const [currentLoad, cpuInfo, processes, memoryInfo] = await Promise.all([ // <-- ДОБАВЛЕНО memoryInfo
            si.currentLoad(),
            si.cpu(),
            si.processes(),
            si.mem(), // <-- ПОЛУЧАЕМ ИНФОРМАЦИЮ О ПАМЯТИ
        ]);

        const totalCpuLoad = parseFloat(currentLoad.currentLoad.toFixed(1));
        const cpuCount = cpuInfo.cores;

        const totalMemoryBytes = memoryInfo.total; // Общая память в байтах

        const processData = processes.list.map(p => ({
            pid: p.pid,
            name: p.name,
            cpuPercent: parseFloat(p.cpu.toFixed(1)),
            // ИСПРАВЛЕННОЕ ВЫЧИСЛЕНИЕ ПРОЦЕНТА ПАМЯТИ
            memPercent: totalMemoryBytes > 0 ? parseFloat(((p.mem / totalMemoryBytes) * 100).toFixed(1)) : 0,
        }));

        // Сортируем по убыванию загрузки ЦП
        processData.sort((a, b) => b.cpuPercent - a.cpuPercent);

        return {
            currentLoad: totalCpuLoad,
            cpuCount: cpuCount,
            processes: processData,
        };

    } catch (error) {
        console.error('Error getting full CPU load info from module:', error);
        return {
            currentLoad: 0,
            cpuCount: 0,
            processes: [],
        };
    }
}