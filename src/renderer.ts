// src/renderer.js

// --- ИНТЕРФЕЙСЫ (должны совпадать с preload.js и systemInfo.ts) ---
// Интерфейс для информации о системе
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
    networkRxBytes: number;
    networkTxBytes: number;
    networkSpeedUp: number;
    networkSpeedDown: number;

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

// Интерфейс для Electron API (что доступно через window.electronAPI)
interface IElectronAPI {
    // Если вам нужна функция getCurrentCpuLoad отдельно, оставьте ее.
    // getCurrentCpuLoad: () => Promise<number>;

    getSystemOverviewInfo: () => Promise<ISystemOverviewInfo>;
}

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ СОРТИРОВКИ И АКТИВНОГО ТАБА ---
let currentSortColumn: 'name' | 'pid' | 'cpuPercent' | 'memPercent' = 'cpuPercent';
let sortDirection: 'asc' | 'desc' = 'desc';
let currentActiveTab: 'overview' | 'processes' | 'memory' | 'disk' | 'network' = 'overview';

// --- ОСНОВНАЯ ЛОГИКА ПРИ ЗАГРУЗКЕ DOM ---
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('CPU-Linux-Mint');
    if (!appContainer) {
        console.error('Элемент с ID "CPU-Linux-Mint" не найден. Невозможно инициализировать приложение.');
        return;
    }

    // --- ГЕНЕРАЦИЯ HTML СТРУКТУРЫ С ТАБАМИ ---
    appContainer.innerHTML = `
        <div class="header-section">
            <h1>Монитор Системы Linux</h1>
            <p id="os-info-display">ОС: Загрузка...</p>
        </div>

        <div class="tabs-navigation">
            <button class="tab-button active" data-tab="overview">Обзор</button>
            <button class="tab-button" data-tab="processes">Процессы</button>
            <button class="tab-button" data-tab="memory">Память</button>
            <button class="tab-button" data-tab="disk">Диск</button>
            <button class="tab-button" data-tab="network">Сеть</button>
        </div>

        <div class="tabs-content">
            <div id="overview-tab-content" class="tab-pane active">
                <h2>Обзор Системы</h2>
                <p id="cpu-load-display">Загрузка ЦП: Загрузка...</p>
                <p id="cpu-count-display">Ядер ЦП: Загрузка...</p>
                <p id="cpu-temp-display">Температура ЦП: Загрузка...</p>
                <p id="ram-overview-display">ОЗУ: Загрузка...</p>
                <p id="disk-overview-display">Диск (/): Загрузка...</p>
                <p id="network-overview-display">Сеть: Загрузка...</p>
                <p id="battery-overview-display">Батарея: Загрузка...</p>
            </div>

            <div id="processes-tab-content" class="tab-pane">
                <h2>Активные Процессы</h2>
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

            <div id="memory-tab-content" class="tab-pane">
                <h2>Использование Памяти</h2>
                <p id="mem-total-display">Всего ОЗУ: Загрузка...</p>
                <p id="mem-used-display">Использовано: Загрузка...</p>
                <p id="mem-free-display">Свободно: Загрузка...</p>
                <p id="mem-percent-display">Процент использования: Загрузка...</p>
                </div>

            <div id="disk-tab-content" class="tab-pane">
                <h2>Использование Диска</h2>
                <p id="disk-root-total-display">Размер корневого раздела (/): Загрузка...</p>
                <p id="disk-root-used-display">Использовано на корневом разделе: Загрузка...</p>
                <p id="disk-root-percent-display">Процент использования: Загрузка...</p>
                </div>

            <div id="network-tab-content" class="tab-pane">
                <h2>Сетевая Активность</h2>
                <p id="network-interface-display">Интерфейс: Загрузка...</p>
                <p id="network-rx-tx-display">Получено/Отправлено (всего): Загрузка...</p>
                <p id="network-speed-display">Текущая скорость: Загрузка...</p>
                </div>
        </div>
    `;

    // --- ПОЛУЧАЕМ ССЫЛКИ НА ВСЕ ЭЛЕМЕНТЫ DOM ---
    const osInfoElement = document.getElementById('os-info-display') as HTMLParagraphElement;

    // Элементы для таба "Обзор"
    const cpuLoadElement = document.getElementById('cpu-load-display') as HTMLParagraphElement;
    const cpuCountElement = document.getElementById('cpu-count-display') as HTMLParagraphElement;
    const cpuTempElement = document.getElementById('cpu-temp-display') as HTMLParagraphElement;
    const ramOverviewElement = document.getElementById('ram-overview-display') as HTMLParagraphElement;
    const diskOverviewElement = document.getElementById('disk-overview-display') as HTMLParagraphElement;
    const networkOverviewElement = document.getElementById('network-overview-display') as HTMLParagraphElement;
    const batteryOverviewElement = document.getElementById('battery-overview-display') as HTMLParagraphElement;

    // Элементы для таба "Процессы"
    const processesListElement = document.getElementById('processes-list') as HTMLUListElement;
    const columnHeaders = document.querySelectorAll<HTMLElement>('.col-header'); // Для сортировки процессов

    // Элементы для таба "Память"
    const memTotalElement = document.getElementById('mem-total-display') as HTMLParagraphElement;
    const memUsedElement = document.getElementById('mem-used-display') as HTMLParagraphElement;
    const memFreeElement = document.getElementById('mem-free-display') as HTMLParagraphElement;
    const memPercentElement = document.getElementById('mem-percent-display') as HTMLParagraphElement;

    // Элементы для таба "Диск"
    const diskRootTotalElement = document.getElementById('disk-root-total-display') as HTMLParagraphElement;
    const diskRootUsedElement = document.getElementById('disk-root-used-display') as HTMLParagraphElement;
    const diskRootPercentElement = document.getElementById('disk-root-percent-display') as HTMLParagraphElement;

    // Элементы для таба "Сеть"
    const networkInterfaceElement = document.getElementById('network-interface-display') as HTMLParagraphElement;
    const networkRxTxElement = document.getElementById('network-rx-tx-display') as HTMLParagraphElement;
    const networkSpeedElement = document.getElementById('network-speed-display') as HTMLParagraphElement;

    // Кнопки табов и панели содержимого
    const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tab-button');
    const tabPanes = document.querySelectorAll<HTMLElement>('.tab-pane');


    // --- ПРОВЕРКА НАЛИЧИЯ ВСЕХ ЭЛЕМЕНТОВ DOM ---
    if (!osInfoElement || !cpuLoadElement || !cpuCountElement || !cpuTempElement ||
        !ramOverviewElement || !diskOverviewElement || !networkOverviewElement || !batteryOverviewElement ||
        !processesListElement || columnHeaders.length === 0 ||
        !memTotalElement || !memUsedElement || !memFreeElement || !memPercentElement ||
        !diskRootTotalElement || !diskRootUsedElement || !diskRootPercentElement ||
        !networkInterfaceElement || !networkRxTxElement || !networkSpeedElement ||
        tabButtons.length === 0 || tabPanes.length === 0
    ) {
        console.error('Ошибка: Не удалось найти все необходимые элементы DOM для табов.');
        return;
    }


    // --- ФУНКЦИЯ ОБНОВЛЕНИЯ ВСЕЙ СИСТЕМНОЙ ИНФОРМАЦИИ ---
    const updateSystemInfo = async () => {
        const electronAPI = (window as any).electronAPI as IElectronAPI;

        if (!electronAPI) {
            // Единая функция для установки текста ошибки для всех элементов
            const setErrorText = (element: HTMLElement, text: string) => {
                if (element) element.textContent = text;
            };

            setErrorText(osInfoElement, 'ОС: API не доступно');
            setErrorText(cpuLoadElement, 'Загрузка ЦП: API не доступно');
            setErrorText(cpuCountElement, 'Ядер ЦП: API не доступно');
            setErrorText(cpuTempElement, 'Температура ЦП: API не доступно');
            setErrorText(ramOverviewElement, 'ОЗУ: API не доступно');
            setErrorText(diskOverviewElement, 'Диск (/): API не доступно');
            setErrorText(networkOverviewElement, 'Сеть: API не доступно');
            setErrorText(batteryOverviewElement, 'Батарея: API не доступно');
            processesListElement.innerHTML = '<li>API не доступно</li>'; // Для списка процессов
            setErrorText(memTotalElement, 'Всего ОЗУ: API не доступно');
            setErrorText(memUsedElement, 'Использовано: API не доступно');
            setErrorText(memFreeElement, 'Свободно: API не доступно');
            setErrorText(memPercentElement, 'Процент использования: API не доступно');
            setErrorText(diskRootTotalElement, 'Размер корневого раздела (/): API не доступно');
            setErrorText(diskRootUsedElement, 'Использовано на корневом разделе: API не доступно');
            setErrorText(diskRootPercentElement, 'Процент использования: API не доступно');
            setErrorText(networkInterfaceElement, 'Интерфейс: API не доступно');
            setErrorText(networkRxTxElement, 'Получено/Отправлено: API не доступно');
            setErrorText(networkSpeedElement, 'Скорость: API не доступно');
            return;
        }

        try {
            // Вызываем новую функцию для получения всей информации
            const systemInfo = await electronAPI.getSystemOverviewInfo();

            // --- Обновление Общих Данных (ОС, CPU) ---
            osInfoElement.textContent = `ОС: ${systemInfo.osDistro} (${systemInfo.osKernel})`;
            cpuLoadElement.textContent = `Загрузка ЦП: ${systemInfo.currentLoad}%`;
            cpuCountElement.textContent = `Ядер ЦП: ${systemInfo.cpuCount}`;
            cpuTempElement.textContent = `Температура ЦП: ${systemInfo.cpuTemperature !== null ? systemInfo.cpuTemperature + '°C' : 'Н/Д'}`;

            // --- Обновление Таба "Обзор" ---
            ramOverviewElement.textContent = `ОЗУ: ${formatBytes(systemInfo.usedMemory)} / ${formatBytes(systemInfo.totalMemory)} (${systemInfo.memPercent}%)`;
            diskOverviewElement.textContent = `Диск (/): ${formatBytes(systemInfo.diskRootUsed)} / ${formatBytes(systemInfo.diskRootTotal)} (${systemInfo.diskRootPercent}%)`;
            if (systemInfo.networkInterface) {
                networkOverviewElement.textContent = `Сеть (${systemInfo.networkInterface}): ↓${formatSpeed(systemInfo.networkSpeedDown)}/сек ↑${formatSpeed(systemInfo.networkSpeedUp)}/сек`;
            } else {
                networkOverviewElement.textContent = `Сеть: Н/Д`;
            }
            if (systemInfo.batteryPercent !== null) {
                let batteryStatusText = '';
                if (systemInfo.batteryIsCharging) {
                    batteryStatusText = ' (Зарядка)';
                } else if (systemInfo.batteryTimeRemaining !== null && systemInfo.batteryTimeRemaining !== -1) {
                    const minutes = systemInfo.batteryTimeRemaining;
                    const hours = Math.floor(minutes / 60);
                    const remainingMinutes = minutes % 60;
                    batteryStatusText = ` (Осталось: ${hours}ч ${remainingMinutes}мин)`;
                }
                batteryOverviewElement.textContent = `Батарея: ${systemInfo.batteryPercent}%${batteryStatusText}`;
            } else {
                batteryOverviewElement.textContent = `Батарея: Н/Д`;
            }


            // --- Обновление Таба "Процессы" ---
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


            // --- Обновление Таба "Память" ---
            memTotalElement.textContent = `Всего ОЗУ: ${formatBytes(systemInfo.totalMemory)}`;
            memUsedElement.textContent = `Использовано: ${formatBytes(systemInfo.usedMemory)}`;
            memFreeElement.textContent = `Свободно: ${formatBytes(systemInfo.freeMemory)}`;
            memPercentElement.textContent = `Процент использования: ${systemInfo.memPercent}%`;


            // --- Обновление Таба "Диск" ---
            diskRootTotalElement.textContent = `Размер корневого раздела (/): ${formatBytes(systemInfo.diskRootTotal)}`;
            diskRootUsedElement.textContent = `Использовано на корневом разделе: ${formatBytes(systemInfo.diskRootUsed)}`;
            diskRootPercentElement.textContent = `Процент использования: ${systemInfo.diskRootPercent}%`;

            // --- Обновление Таба "Сеть" ---
            networkInterfaceElement.textContent = `Интерфейс: ${systemInfo.networkInterface || 'Н/Д'}`;
            networkRxTxElement.textContent = `Получено/Отправлено (всего): ${formatBytes(systemInfo.networkRxBytes)} / ${formatBytes(systemInfo.networkTxBytes)}`;
            networkSpeedElement.textContent = `Текущая скорость: ↓${formatSpeed(systemInfo.networkSpeedDown)}/сек ↑${formatSpeed(systemInfo.networkSpeedUp)}/сек`;


        } catch (error) {
            console.error('Ошибка при получении полной информации о системе:', error);
            // Единая функция для установки текста ошибки для всех элементов
            const setErrorText = (element: HTMLElement, text: string) => {
                if (element) element.textContent = text;
            };

            setErrorText(osInfoElement, 'ОС: Ошибка');
            setErrorText(cpuLoadElement, 'Загрузка ЦП: Ошибка');
            setErrorText(cpuCountElement, 'Ядер ЦП: Ошибка');
            setErrorText(cpuTempElement, 'Температура ЦП: Ошибка');
            setErrorText(ramOverviewElement, 'ОЗУ: Ошибка');
            setErrorText(diskOverviewElement, 'Диск (/): Ошибка');
            setErrorText(networkOverviewElement, 'Сеть: Ошибка');
            setErrorText(batteryOverviewElement, 'Батарея: Ошибка');
            processesListElement.innerHTML = '<li>Ошибка загрузки процессов</li>'; // Для списка процессов
            setErrorText(memTotalElement, 'Всего ОЗУ: Ошибка');
            setErrorText(memUsedElement, 'Использовано: Ошибка');
            setErrorText(memFreeElement, 'Свободно: Ошибка');
            setErrorText(memPercentElement, 'Процент использования: Ошибка');
            setErrorText(diskRootTotalElement, 'Размер корневого раздела (/): Ошибка');
            setErrorText(diskRootUsedElement, 'Использовано на корневом разделе: Ошибка');
            setErrorText(diskRootPercentElement, 'Процент использования: Ошибка');
            setErrorText(networkInterfaceElement, 'Интерфейс: Ошибка');
            setErrorText(networkRxTxElement, 'Получено/Отправлено: Ошибка');
            setErrorText(networkSpeedElement, 'Скорость: Ошибка');
        }
    };

    // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ТАБОВ ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            // Удаляем активный класс со всех кнопок и панелей
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Добавляем активный класс к нажатой кнопке
            button.classList.add('active');

            // Показываем соответствующую панель
            const targetPane = document.getElementById(`${tabId}-tab-content`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            currentActiveTab = tabId as typeof currentActiveTab; // Обновляем активный таб
        });
    });

    // --- ФУНКЦИЯ ОБНОВЛЕНИЯ ИНДИКАТОРОВ СОРТИРОВКИ (для процессов) ---
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

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ ЗАГОЛОВКОВ ТАБЛИЦЫ ПРОЦЕССОВ ---
    columnHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.dataset.sortBy as 'name' | 'pid' | 'cpuPercent' | 'memPercent';

            if (sortBy === currentSortColumn) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortBy;
                // По умолчанию сортировка по CPU/RAM/PID - по убыванию, по имени - по возрастанию
                if (sortBy === 'cpuPercent' || sortBy === 'memPercent' || sortBy === 'pid') {
                    sortDirection = 'desc';
                } else {
                    sortDirection = 'asc';
                }
            }
            updateSystemInfo(); // Перезапрашиваем и обновляем данные с новой сортировкой
        });
    });

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ФОРМАТИРОВАНИЯ ДАННЫХ ---
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

    // --- ИНИЦИАЛИЗАЦИЯ: ПЕРВЫЙ ЗАПРОС И УСТАНОВКА ИНТЕРВАЛА ---
    updateSystemInfo(); // Выполняем первый запрос сразу при загрузке
    setInterval(updateSystemInfo, 3000); // Обновление каждые 3 секунды
});