import * as turbine from "turbine";
import TdaoMysql = turbine.dao.TdaoMysql;
import { TcommandsDao } from './TcommandsDao';
import Promise = require('bluebird');
export declare class TservicesDao extends TdaoMysql {
    daoCommands: TcommandsDao;
    constructor(objectClassName: any, datasource: any, config: any);
    reset(): Promise<{}>;
    getByName(name: string): Promise<any>;
    getServicesToCheck(opt: any): Promise<any>;
    processObjects(objects: any, fields: any): Promise<any>;
    getCommand(obj: any): Promise<any>;
    saveServices(services: any): Promise<any>;
    setScheduled(idList: any, value: any): Promise<{}>;
}
