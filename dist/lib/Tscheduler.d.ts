/// <reference types="bluebird" />
import * as turbine from "turbine";
import TeventDispatcher = turbine.events.TeventDispatcher;
import Ttimer = turbine.tools.Ttimer;
import Promise = require("bluebird");
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
    getSaveQueueLength(): Promise<{}>;
    onSaveTimer(): void;
    onStatTimer(): void;
}
