import * as turbine from "turbine";
import TdaoMysql = turbine.dao.TdaoMysql;
import { TcommandsDao } from './TcommandsDao';
import Promise = require('bluebird');
export declare class TservicesDao extends TdaoMysql {
    daoCommands: TcommandsDao;
    jsonFields: {
        "perfdata": boolean;
        "args": boolean;
    };
    constructor(objectClassName: any, datasource: any, config: any);
    reset(): Promise<{}>;
    getByName(name: string): Promise<any>;
    getServicesToCheck(opt: any): Promise<any>;
    processObjects(objects: any, fields: any): Promise<any>;
    getCommand(obj: any): Promise<any>;
    saveCheckResults(results: any): Promise<any>;
    getUniqueParents(childrenIds: any): Promise<{}>;
    getParents(id: any): Promise<{}>;
    setScheduled(idList: any, value: any): Promise<{}>;
}
