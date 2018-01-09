import { TdaoMysql } from '../../../dao/TdaoMysql';
import { TcommandsDao } from './TcommandsDao';
import promise = require('bluebird');
export declare class TservicesDao extends TdaoMysql {
    daoCommands: TcommandsDao;
    constructor(objectClassName: any, datasource: any, config: any);
    reset(): any;
    getByName(name: string): any;
    getServicesToCheck(opt: any): promise<any>;
    processObjects(objects: any, fields: any): Promise<any[]>;
    setCommand(service: any): any;
    saveServices(services: any): any;
    setScheduled(idList: any, value: any): any;
}
