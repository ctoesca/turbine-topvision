import { TdaoMysql } from '../../../dao/TdaoMysql';
import promise = require('bluebird');
export declare class TcommandsDao extends TdaoMysql {
    constructor(objectClassName: any, datasource: any, config: any);
    processObjects(objects: any, fields: any): any;
    getByName(name: any): promise<any>;
}
