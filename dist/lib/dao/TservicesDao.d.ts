/// <reference types="bluebird" />
import * as turbine from "turbine";
import TdaoMysql = turbine.dao.TdaoMysql;
import { TcommandsDao } from './TcommandsDao';
import promise = require('bluebird');
export declare class TservicesDao extends TdaoMysql {
    daoCommands: TcommandsDao;
    constructor(objectClassName: any, datasource: any, config: any);
    reset(): promise<{}>;
    getByName(name: string): promise<any>;
    getServicesToCheck(opt: any): promise<any>;
    processObjects(objects: any, fields: any): Promise<any[]>;
    setCommand(service: any): any;
    saveServices(services: any): Promise<number> | promise<{}>;
    setScheduled(idList: any, value: any): promise<{}> | Promise<{}>;
}
