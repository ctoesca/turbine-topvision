import { Ttimer } from '../../../tools/Ttimer';
import { TbaseService } from '../../TbaseService';
export declare class TagentsService extends TbaseService {
    agentsInstances: any[];
    invalidatedAgents: any[];
    httpServer: any;
    app: any;
    dao: any;
    monitoringTimer: Ttimer;
    constructor(name: any, server: any, config: any);
    createInstance(mixed: any, port: any, https: any): any;
    onAgentFailure(e: any): void;
    getAgentInstance(host: any, port: any): any;
    getAgentInstanceIndex(array: any, host: any, port: any): any;
    removeAgentInstance(array: any, agent: any): boolean;
    invalidateAgent(agent: any): void;
    getRandomItem(array: any): any;
    logAgentsActifs(): void;
    onMonitoringTimer(): void;
    getAgentForHost(host: any, port: any): any;
    loadAgents(): any;
    getAgentByHostAndPort(host: any, port: any): any;
    getDefaultConfig(): {
        "active": boolean;
        "executionPolicy": string;
        "apiPath": string;
    };
    start(): void;
    stop(): void;
    check(req: any, res: any, next: any): void;
}
