
interface IFullCpuLoadInfo {
    currentLoad: number;
    cpuCount: number;
    processes: Array<{
        pid: number;
        name: string;
        cpuPercent: number;
        memPercent: number;
    }>;
}

interface IElectronAPI {
    getCurrentCpuLoad: () => Promise<number>;
    getFullCpuLoadInfo: () => Promise<IFullCpuLoadInfo>; // Обновлено
}


let currentSortColumn: 'name' | 'pid' | 'cpuPercent' | 'memPercent' = 'cpuPercent';
let sortDirection: 'asc' | 'desc' = 'desc';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('CPU-Linux-Mint');
    if (!appContainer) {
        console.error('Элемент с ID "app" не найден. Невозможно инициализировать приложение.');
        return;
    }

    appContainer.innerHTML = `
        <div class="header-section">
            <h1>Монитор Загрузки ЦП</h1>
            <p id="cpu-load-display">Загрузка ЦП: Загрузка...</p>
            <p id="cpu-count-display">Ядер ЦП: Загрузка...</p>
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


    const cpuLoadElement = document.getElementById('cpu-load-display');
    const cpuCountElement = document.getElementById('cpu-count-display');
    const processesListElement = document.getElementById('processes-list');
    const columnHeaders = document.querySelectorAll<HTMLElement>('.col-header');

    if (!cpuLoadElement || !cpuCountElement || !processesListElement || columnHeaders.length === 0) {
        console.error('Ошибка: Не удалось найти динамически созданные элементы DOM.');
        return;
    }

    const updateCpuInfo = async () => {
        const electronAPI = (window as any).electronAPI as IElectronAPI;

        if (!electronAPI) {
            cpuLoadElement.textContent = 'API не доступно';
            cpuCountElement.textContent = '';
            processesListElement.innerHTML = '<li>API не доступно</li>';
            return;
        }

        try {
            const cpuInfo = await electronAPI.getFullCpuLoadInfo();

            cpuLoadElement.textContent = `Загрузка ЦП: ${cpuInfo.currentLoad}%`;
            cpuCountElement.textContent = `Ядер ЦП: ${cpuInfo.cpuCount}`;

            const sortedProcesses = [...cpuInfo.processes].sort((a, b) => {
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
            console.error('Ошибка при получении детальной информации о ЦП:', error);
            cpuLoadElement.textContent = 'Ошибка загрузки ЦП';
            cpuCountElement.textContent = 'Ошибка';
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
            updateCpuInfo();
        });
    });

    updateCpuInfo();
    setInterval(updateCpuInfo, 1000);
});