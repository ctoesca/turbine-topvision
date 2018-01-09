/// <reference types="express" />
import * as turbine from "turbine";
import Ttimer = turbine.tools.Ttimer;
import ThttpServer = turbine.services.ThttpServer;
import express = require('express');
import { Tscheduler } from './Tscheduler';
import { Tworker } from './Tworker';
import { TservicesDao } from './dao/TservicesDao';
import { TagentsService } from './agents/TagentsService';
import { TagentsEndpoint } from './agents/TagentsEndpoint';
import { TserviceCommand } from './crudServices/TserviceCommand';
export declare class Tchecker extends turbine.services.TbaseService {
    app: express.Application;
    httpServer: ThttpServer;
    pluginsManager: any;
    statTimerIterval: number;
    subscribeClient: any;
    daoServices: TservicesDao;
    statTimer: Ttimer;
    redisClient: any;
    scheduler: Tscheduler;
    worker: Tworker;
    lastStat: any;
    requestRate: number;
    pubSubServer: any;
    agentsService: TagentsService;
    static test(): void;
    constructor(name: any, server: any, config: any);
    static getCommandsServiceClass(): typeof TserviceCommand;
    static getAgentsEndPointClass(): typeof TagentsEndpoint;
    check(req: any, res: any): void;
    getDefaultConfig(): {
        "active": boolean;
        "executionPolicy": string;
        "apiPath": string;
        "scheduler": {
            "statTimerInterval": number;
            "scheduleInterval": number;
            "maxQueueLength": number;
            "maxScheduleSize": number;
            "scheduleOnlyIfQueueIsEmpty": boolean;
            "saveInterval": number;
        };
        "worker": {
            "maxConcurrentRequests": number;
            "statTimerInterval": number;
            "workInterval": number;
            "maxSamePluginInstances": number;
            "pluginTimeout": number;
        };
    };
    start(): void;
    stop(): void;
    onBusMessage(channel: any, message: any): void;
    onIsMasterChanged(e: any): void;
    preProcess(req: any, res: any): boolean;
    savePlugin(req: any, res: any): void;
    onStatTimer(): void;
    head(req: any, res: any): void;
    setSchedulerConfig(req: any, res: any, next: any): void;
    getSchedulerConfig(req: any, res: any, next: any): void;
    setWorkersConfig(req: any, res: any, next: any): void;
    getWorkersConfig(req: any, res: any, next: any): void;
    killAllWorker(req: any, res: any, next: any): void;
    killWorker(req: any, res: any, next: any): void;
    generateServices(req: any, res: any): void;
    test(req: any, res: any): void;
}
