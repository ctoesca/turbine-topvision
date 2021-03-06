import * as turbine from "turbine";
import TcrudRestEndpoint = turbine.rest.TcrudRestEndpoint;
import TcrudServiceBase = turbine.TcrudServiceBase;
import { TagentsService } from './TagentsService';
export declare class TagentsEndpoint extends TcrudRestEndpoint {
    startDate: any;
    constructor(config: any);
    init(): void;
    _createService(): TcrudServiceBase;
    getAgentService(): TagentsService;
    checkAgentByHostAndPort(req: any, res: any, next: any): void;
    saveAgentStatus(host: any, port: any, data: any): void;
    setConfig(req: any, res: any, next: any): void;
    getConfig(req: any, res: any, next: any): void;
    checkAgent(req: any, res: any, next: any): void;
}
