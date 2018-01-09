import * as turbine from "turbine";
import TeventDispatcher = turbine.events.TeventDispatcher;
import Ttimer = turbine.tools.Ttimer;
export declare class Tworker extends TeventDispatcher {
    redisClient: any;
    logger: any;
    config: any;
    daoClass: string;
    pluginsManager: any;
    runningRequestsCount: number;
    totalRequestsCount: number;
    totalRequestsCompletedCount: number;
    lastStat: any;
    daoServices: any;
    statTimer: Ttimer;
    workTimer: Ttimer;
    requestRate: any;
    pubSubServer: any;
    constructor(config: any, pluginsManager: any);
    setConfig(config: any): void;
    start(): void;
    stop(): void;
    onWorkTimer(): void;
    getErrorMessage(err: any): string;
    check(service: any, onCompleted: any): void;
    onStatTimer(): void;
}
