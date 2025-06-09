// src/renderer.js (или ваш аналогичный файл)

// !!! ВАЖНО: Обновите этот импорт, если вы переименовали файл с модулем !!!
// export interface ISystemOverviewInfo { ... }
// export async function getSystemOverviewInfo(): Promise<ISystemOverviewInfo> { ... }
// Если ваш модуль теперь называется systemInfo.ts, то вам нужно будет убедиться,
// что в preload.js ipcRenderer.invoke('get-system-overview-info') ссылается на этот новый метод.

// Обновленный интерфейс, который соответствует ISystemOverviewInfo из вашего модуля
interface ISystemOverviewInfo {
    // CPU
    currentLoad: number;
    cpuCount: number;
    cpuTemperature: number | null;

    // RAM
    totalMemory: number;
    usedMemory: number;
    freeMemory: number;
    memPercent: number;

    // Диски (только корневой раздел)
    diskRootUsed: number;
    diskRootTotal: number;
    diskRootPercent: number;

    // Сеть
    networkInterface: string | null;
    networkRxBytes: number; // Общее количество полученных байт
    networkTxBytes: number; // Общее количество отправленных байт
    networkSpeedUp: number; // Скорость выгрузки в байтах/сек
    networkSpeedDown: number; // Скорость загрузки в байтах/сек

    // Батарея
    batteryPercent: number | null;
    batteryIsCharging: boolean | null;
    batteryTimeRemaining: number | null;

    // Общая информация об ОС
    osPlatform: string;
    osDistro: string;
    osKernel: string;

    // Список процессов
    processes: Array<{
        pid: number;
        name: string;
        cpuPercent: number;
        memPercent: number;
    }>;
}

// Обновленный интерфейс для Electron API
interface IElectronAPI {
    getCurrentCpuLoad: () => Promise<number>; // Возможно, эта функция уже не нужна, если все данные в getSystemOverviewInfo
    getSystemOverviewInfo: () => Promise<ISystemOverviewInfo>; // Использовать новое имя функции
}


let currentSortColumn: 'name' | 'pid' | 'cpuPercent' | 'memPercent' = 'cpuPercent';
let sortDirection: 'asc' | 'desc' = 'desc';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('CPU-Linux-Mint');
    if (!appContainer) {
        console.error('Элемент с ID "CPU-Linux-Mint" не найден. Невозможно инициализировать приложение.');
        return;
    }

    // --- ОБНОВЛЕННАЯ HTML СТРУКТУРА ---
    appContainer.innerHTML = `
        <div class="header-section">
            <h1>Монитор Системы Linux</h1>
            <p id="os-info-display">ОС: Загрузка...</p>
            <p id="cpu-load-display">Загрузка ЦП: Загрузка...</p>
            <p id="cpu-count-display">Ядер ЦП: Загрузка...</p>
            <p id="cpu-temp-display">Температура ЦП: Загрузка...</p>
        </div>

        <div class="system-overview-section">
            <h2>Обзор Системы</h2>
            <p id="ram-info-display">ОЗУ: Загрузка...</p>
            <p id="disk-info-display">Диск (/): Загрузка...</p>
            <p id="network-info-display">Сеть: Загрузка...</p>
            <p id="battery-info-display">Батарея: Загрузка...</p>
        </div>

        <div class="processes-section">
            <h2>Активные Процессы (по ЦП)</h2>
            <div class="processes-table">
                <div class="table-header">
                    <span class="col-header col-name" data-sort-by="name">Имя Процесса <span class="sort-indicator"></span></span>
                    <span class="col-header col-pid" data-sort-by="pid">PID <span class="sort-indicator"></span></span>
                    <span class="col-header col-cpu" data-sort-by="cpuPercent">ЦП % <span class="sort-indicator"></span></span>
                    <span class="col-header col-mem" data-sort-by="memPercent">Память % <span class="sort-indicator"></span></span>
                </div>
                <ul id="processes-list">
                    <li>Загрузка процессов...</li>
                </ul>
            </div>
        </div>
    `;

    // --- ПОЛУЧАЕМ ССЫЛКИ НА НОВЫЕ ЭЛЕМЕНТЫ DOM ---
    const cpuLoadElement = document.getElementById('cpu-load-display');
    const cpuCountElement = document.getElementById('cpu-count-display');
    const cpuTempElement = document.getElementById('cpu-temp-display');
    const osInfoElement = document.getElementById('os-info-display');

    const ramInfoElement = document.getElementById('ram-info-display');
    const diskInfoElement = document.getElementById('disk-info-display');
    const networkInfoElement = document.getElementById('network-info-display');
    const batteryInfoElement = document.getElementById('battery-info-display');

    const processesListElement = document.getElementById('processes-list');
    const columnHeaders = document.querySelectorAll<HTMLElement>('.col-header');

    if (!cpuLoadElement || !cpuCountElement || !cpuTempElement || !osInfoElement ||
        !ramInfoElement || !diskInfoElement || !networkInfoElement || !batteryInfoElement ||
        !processesListElement || columnHeaders.length === 0) {
        console.error('Ошибка: Не удалось найти все необходимые элементы DOM.');
        return;
    }

    const updateSystemInfo = async () => { // Переименована функция
        const electronAPI = (window as any).electronAPI as IElectronAPI;

        if (!electronAPI) {
            // Обновляем все элементы при недоступности API
            cpuLoadElement.textContent = 'API не доступно';
            cpuCountElement.textContent = '';
            cpuTempElement.textContent = '';
            osInfoElement.textContent = '';
            ramInfoElement.textContent = '';
            diskInfoElement.textContent = '';
            networkInfoElement.textContent = '';
            batteryInfoElement.textContent = '';
            processesListElement.innerHTML = '<li>API не доступно</li>';
            return;
        }

        try {
            // Вызываем новую функцию для получения всей информации
            const systemInfo = await electronAPI.getSystemOverviewInfo();

            // --- ОБНОВЛЕНИЕ ДАННЫХ В UI ---

            // OS Info
            osInfoElement.textContent = `ОС: ${systemInfo.osDistro} (${systemInfo.osKernel})`;

            // CPU
            cpuLoadElement.textContent = `Загрузка ЦП: ${systemInfo.currentLoad}%`;
            cpuCountElement.textContent = `Ядер ЦП: ${systemInfo.cpuCount}`;
            cpuTempElement.textContent = `Температура ЦП: ${systemInfo.cpuTemperature !== null ? systemInfo.cpuTemperature + '°C' : 'Н/Д'}`;

            // RAM
            ramInfoElement.textContent = `ОЗУ: ${formatBytes(systemInfo.usedMemory)} / ${formatBytes(systemInfo.totalMemory)} (${systemInfo.memPercent}%)`;

            // Disk (Root)
            diskInfoElement.textContent = `Диск (/): ${formatBytes(systemInfo.diskRootUsed)} / ${formatBytes(systemInfo.diskRootTotal)} (${systemInfo.diskRootPercent}%)`;

            // Network
            if (systemInfo.networkInterface) {
                networkInfoElement.textContent = `Сеть (${systemInfo.networkInterface}): ↓${formatSpeed(systemInfo.networkSpeedDown)}/сек ↑${formatSpeed(systemInfo.networkSpeedUp)}/сек`;
            } else {
                networkInfoElement.textContent = `Сеть: Н/Д`;
            }


            // Battery
            if (systemInfo.batteryPercent !== null) {
                let batteryStatusText = '';
                if (systemInfo.batteryIsCharging) {
                    batteryStatusText = ' (Зарядка)';
                } else if (systemInfo.batteryTimeRemaining !== null) {
                    const minutes = systemInfo.batteryTimeRemaining;
                    const hours = Math.floor(minutes / 60);
                    const remainingMinutes = minutes % 60;
                    batteryStatusText = ` (Осталось: ${hours}ч ${remainingMinutes}мин)`;
                }
                batteryInfoElement.textContent = `Батарея: ${systemInfo.batteryPercent}%${batteryStatusText}`;
            } else {
                batteryInfoElement.textContent = `Батарея: Н/Д`;
            }


            // Processes (логика сортировки остается прежней)
            const sortedProcesses = [...systemInfo.processes].sort((a, b) => {
                let comparison = 0;
                const aValue = a[currentSortColumn];
                const bValue = b[currentSortColumn];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else {
                    comparison = (aValue as number) - (bValue as number);
                }

                return sortDirection === 'asc' ? comparison : -comparison;
            });

            processesListElement.innerHTML = '';
            sortedProcesses.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="process-name">${p.name}</span>
                    <span class="process-pid">${p.pid}</span>
                    <span class="process-cpu">${p.cpuPercent}%</span>
                    <span class="process-mem">${p.memPercent}%</span>
                `;
                processesListElement.appendChild(li);
            });

            updateSortIndicators();

        } catch (error) {
            console.error('Ошибка при получении полной информации о системе:', error);
            // Обновляем все элементы при ошибке
            osInfoElement.textContent = 'ОС: Ошибка';
            cpuLoadElement.textContent = 'Загрузка ЦП: Ошибка';
            cpuCountElement.textContent = 'Ядер ЦП: Ошибка';
            cpuTempElement.textContent = 'Температура ЦП: Ошибка';
            ramInfoElement.textContent = 'ОЗУ: Ошибка';
            diskInfoElement.textContent = 'Диск: Ошибка';
            networkInfoElement.textContent = 'Сеть: Ошибка';
            batteryInfoElement.textContent = 'Батарея: Ошибка';
            processesListElement.innerHTML = '<li>Ошибка загрузки процессов</li>';
        }
    };

    const updateSortIndicators = () => {
        columnHeaders.forEach(header => {
            const sortBy = header.dataset.sortBy;
            const indicator = header.querySelector('.sort-indicator');

            if (indicator) {
                indicator.classList.remove('asc', 'desc');
            }

            if (sortBy === currentSortColumn && indicator) {
                indicator.classList.add(sortDirection);
            }
        });
    };

    columnHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.dataset.sortBy as 'name' | 'pid' | 'cpuPercent' | 'memPercent';

            if (sortBy === currentSortColumn) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortBy;
                if (sortBy === 'cpuPercent' || sortBy === 'memPercent' || sortBy === 'pid') {
                    sortDirection = 'desc';
                } else {
                    sortDirection = 'asc';
                }
            }
            updateSystemInfo(); // Вызываем новую функцию
        });
    });

    // Вспомогательные функции для форматирования
    function formatBytes(bytes: number, decimals = 2): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function formatSpeed(bytesPerSecond: number, decimals = 2): string {
        if (bytesPerSecond === 0) return '0 B/s';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']; // Для скорости
        const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
        return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }


    updateSystemInfo(); // Первичный вызов
    setInterval(updateSystemInfo, 3000); // Обновление каждые 3 секунды
});