import si from 'systeminformation';

// --- ОПРЕДЕЛЕНИЕ НОВОГО ИНТЕРФЕЙСА ДЛЯ ПОЛНОЙ ИНФОРМАЦИИ ---
export interface ISystemOverviewInfo {
    // CPU
    currentLoad: number; // Общая загрузка CPU
    cpuCount: number;    // Количество логических ядер
    cpuTemperature: number | null; // Температура CPU в °C

    // RAM
    totalMemory: number;  // Всего ОЗУ в байтах
    usedMemory: number;   // Использовано ОЗУ в байтах
    freeMemory: number;   // Свободно ОЗУ в байтах
    memPercent: number;   // Использовано ОЗУ в процентах

    // Диски (только корневой раздел)
    diskRootUsed: number; // Использовано на корневом разделе в байтах
    diskRootTotal: number; // Всего на корневом разделе в байтах
    diskRootPercent: number; // Использовано на корневом разделе в процентах

    // Сеть (для интерфейса по умолчанию, или wlp2s0 если он есть)
    networkInterface: string | null; // Имя активного сетевого интерфейса
    networkRxBytes: number; // Получено байт
    networkTxBytes: number; // Отправлено байт
    networkSpeedUp: number; // Скорость выгрузки в байтах/сек
    networkSpeedDown: number; // Скорость загрузки в байтах/сек

    // Батарея (если есть)
    batteryPercent: number | null; // Процент заряда батареи
    batteryIsCharging: boolean | null; // Заряжается ли
    batteryTimeRemaining: number | null; // Время до полного разряда/заряда (минуты)

    // Общая информация об ОС
    osPlatform: string;   // Платформа (e.g., 'linux', 'win32')
    osDistro: string;     // Дистрибутив (e.g., 'Linux Mint')
    osKernel: string;     // Версия ядра

    // Список процессов
    processes: Array<{
        pid: number;
        name: string;
        cpuPercent: number;
        memPercent: number;
    }>;
}

// --- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ТЕКУЩЕЙ НАГРУЗКИ CPU (осталась без изменений, если нужна отдельно) ---
export async function getCurrentCpuLoad(): Promise<number> {
    try {
        const cpu = await si.currentLoad();
        return parseFloat(cpu.currentLoad.toFixed(1));
    } catch (error) {
        console.error('Error getting current CPU load from module:', error);
        return 0;
    }
}

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ПОЛНОЙ ИНФОРМАЦИИ ---
export async function getSystemOverviewInfo(): Promise<ISystemOverviewInfo> {
    try {
        const [
            currentLoad,
            cpuInfo,
            cpuTemp,
            processes,
            memoryInfo,
            fsSize,
            networkStats,
            networkInterfaces, // Дополнительно для определения интерфейса по умолчанию
            batteryInfo,
            osInfo,
        ] = await Promise.all([
            si.currentLoad(),
            si.cpu(),
            si.cpuTemperature(),
            si.processes(),
            si.mem(),
            si.fsSize(),
            si.networkStats(), // Статистика по всем интерфейсам
            si.networkInterfaces(), // Для определения имени интерфейса
            si.battery(),
            si.osInfo(),
        ]);

        const totalCpuLoad = parseFloat(currentLoad.currentLoad.toFixed(1));
        const cpuCount = cpuInfo.cores;
        const cpuTemperature = cpuTemp.main !== -1 ? parseFloat(cpuTemp.main.toFixed(1)) : null; // -1 означает недоступно

        // RAM
        const totalMemoryBytes = memoryInfo.total;
        const usedMemoryBytes = memoryInfo.used;
        const freeMemoryBytes = memoryInfo.free;
        const memPercent = totalMemoryBytes > 0 ? parseFloat(((usedMemoryBytes / totalMemoryBytes) * 100).toFixed(1)) : 0;

        // Диски (только корневой раздел)
        const rootFs = fsSize.find(fs => fs.mount === '/');
        const diskRootUsed = rootFs ? rootFs.used : 0;
        const diskRootTotal = rootFs ? rootFs.size : 0;
        const diskRootPercent = rootFs && rootFs.size > 0 ? parseFloat(((rootFs.used / rootFs.size) * 100).toFixed(1)) : 0;

        // Сеть - пытаемся найти wlp2s0, иначе берем первый активный
        let networkInterfaceName: string | null = null;
        let networkRxBytes = 0;
        let networkTxBytes = 0;
        let networkSpeedUp = 0;
        let networkSpeedDown = 0;

        const wlp2s0_stats = networkStats.find(ni => ni.iface === 'wlp2s0');
        if (wlp2s0_stats) {
            networkInterfaceName = 'wlp2s0';
            networkRxBytes = wlp2s0_stats.rx_bytes;
            networkTxBytes = wlp2s0_stats.tx_bytes;
            networkSpeedUp = wlp2s0_stats.tx_sec; // Скорость выгрузки в байтах/сек
            networkSpeedDown = wlp2s0_stats.rx_sec; // Скорость загрузки в байтах/сек
        } else if (networkStats.length > 0) {
            // Если wlp2s0 не найден, берем статистику для первого активного интерфейса
            const default_iface_info = networkInterfaces.find(ni => ni.default && ni.ip4); // Ищем дефолтный и активный
            const default_stats = default_iface_info ? networkStats.find(ns => ns.iface === default_iface_info.iface) : null;
            if (default_stats) {
                networkInterfaceName = default_stats.iface;
                networkRxBytes = default_stats.rx_bytes;
                networkTxBytes = default_stats.tx_bytes;
                networkSpeedUp = default_stats.tx_sec;
                networkSpeedDown = default_stats.rx_sec;
            } else {
                 // Fallback: если ни wlp2s0, ни дефолтный не найдены, берем первый доступный с IP
                const first_active_iface = networkInterfaces.find(ni => ni.ip4);
                if (first_active_iface) {
                    const first_active_stats = networkStats.find(ns => ns.iface === first_active_iface.iface);
                    if (first_active_stats) {
                        networkInterfaceName = first_active_stats.iface;
                        networkRxBytes = first_active_stats.rx_bytes;
                        networkTxBytes = first_active_stats.tx_bytes;
                        networkSpeedUp = first_active_stats.tx_sec;
                        networkSpeedDown = first_active_stats.rx_sec;
                    }
                }
            }
        }


        // Батарея
        const batteryPercent = batteryInfo.percent !== null ? parseFloat(batteryInfo.percent.toFixed(1)) : null;
        const batteryIsCharging = batteryInfo.isCharging !== null ? batteryInfo.isCharging : null;
        const batteryTimeRemaining = batteryInfo.timeRemaining !== null && batteryInfo.timeRemaining !== -1 ? batteryInfo.timeRemaining : null; // -1 = неизвестно

        // Информация об ОС
        const osPlatform = osInfo.platform;
        const osDistro = osInfo.distro;
        const osKernel = osInfo.kernel;

        // Процессы
        const processData = processes.list.map(p => ({
            pid: p.pid,
            name: p.name,
            cpuPercent: parseFloat(p.cpu.toFixed(1)),
            memPercent: totalMemoryBytes > 0 ? parseFloat(((p.mem / totalMemoryBytes) * 100).toFixed(1)) : 0,
        }));
        processData.sort((a, b) => b.cpuPercent - a.cpuPercent); // Сортируем по CPU

        return {
            currentLoad: totalCpuLoad,
            cpuCount: cpuCount,
            cpuTemperature: cpuTemperature,

            totalMemory: totalMemoryBytes,
            usedMemory: usedMemoryBytes,
            freeMemory: freeMemoryBytes,
            memPercent: memPercent,

            diskRootUsed: diskRootUsed,
            diskRootTotal: diskRootTotal,
            diskRootPercent: diskRootPercent,

            networkInterface: networkInterfaceName,
            networkRxBytes: networkRxBytes,
            networkTxBytes: networkTxBytes,
            networkSpeedUp: networkSpeedUp,
            networkSpeedDown: networkSpeedDown,

            batteryPercent: batteryPercent,
            batteryIsCharging: batteryIsCharging,
            batteryTimeRemaining: batteryTimeRemaining,

            osPlatform: osPlatform,
            osDistro: osDistro,
            osKernel: osKernel,

            processes: processData,
        };

    } catch (error) {
        console.error('Error getting full system overview info:', error);
        // Возвращаем дефолтные значения при ошибке
        return {
            currentLoad: 0,
            cpuCount: 0,
            cpuTemperature: null,

            totalMemory: 0,
            usedMemory: 0,
            freeMemory: 0,
            memPercent: 0,

            diskRootUsed: 0,
            diskRootTotal: 0,
            diskRootPercent: 0,

            networkInterface: null,
            networkRxBytes: 0,
            networkTxBytes: 0,
            networkSpeedUp: 0,
            networkSpeedDown: 0,

            batteryPercent: null,
            batteryIsCharging: null,
            batteryTimeRemaining: null,

            osPlatform: 'unknown',
            osDistro: 'unknown',
            osKernel: 'unknown',

            processes: [],
        };
    }
}