
import si from 'systeminformation';


export interface IFullCpuLoadInfo {
    currentLoad: number; 
    cpuCount: number;    
    processes: Array<{  
        pid: number;
        name: string;
        cpuPercent: number; 
        memPercent: number;
    }>;
}


export async function getCurrentCpuLoad(): Promise<number> {
    try {
        const cpu = await si.currentLoad();
        return parseFloat(cpu.currentLoad.toFixed(1));
    } catch (error) {
        console.error('Error getting current CPU load from module:', error);
        return 0;
    }
}


export async function getFullCpuLoadInfo(): Promise<IFullCpuLoadInfo> {
    try {
        const [currentLoad, cpuInfo, processes, memoryInfo] = await Promise.all([ 
            si.currentLoad(),
            si.cpu(),
            si.processes(),
            si.mem(), 
        ]);

        const totalCpuLoad = parseFloat(currentLoad.currentLoad.toFixed(1));
        const cpuCount = cpuInfo.cores;

        const totalMemoryBytes = memoryInfo.total; 

        const processData = processes.list.map(p => ({
            pid: p.pid,
            name: p.name,
            cpuPercent: parseFloat(p.cpu.toFixed(1)),
            memPercent: totalMemoryBytes > 0 ? parseFloat(((p.mem / totalMemoryBytes) * 100).toFixed(1)) : 0,
        }));

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