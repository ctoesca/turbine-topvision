import { TeventDispatcher } from '../../events/TeventDispatcher';
import { Ttimer } from '../../tools/Ttimer';
export declare class Tscheduler extends TeventDispatcher {
    scheduleTimer: Ttimer;
    saveTimer: Ttimer;
    saving: boolean;
    logger: any;
    daoClass: string;
    redisClient: any;
    scheduling: number;
    queueLength: number;
    lastStat: any;
    daoServices: any;
    statTimer: Ttimer;
    config: any;
    savingResults: boolean;
    resultsCount: number;
    pubSubServer: any;
    constructor(config: any);
    start(): void;
    stop(): void;
    setConfig(config: any): void;
    onScheduleTimer(): void;
    saveResults(): void;
    getSaveQueueLength(): any;
    onSaveTimer(): void;
    onStatTimer(): void;
}
