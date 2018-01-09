import { TcrudRestEndpoint } from '../../../rest/TcrudRestEndpoint';
import { TagentsService } from './TagentsService';
export declare class TagentsEndpoint extends TcrudRestEndpoint {
    startDate: any;
    constructor(config: any);
    init(): void;
    getAgentService(): TagentsService;
    checkAgentByHostAndPort(req: any, res: any, next: any): void;
    saveAgentStatus(host: any, port: any, data: any): void;
    setConfig(req: any, res: any, next: any): void;
    getConfig(req: any, res: any, next: any): void;
    checkAgent(req: any, res: any, next: any): void;
}
