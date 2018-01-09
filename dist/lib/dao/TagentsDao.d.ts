import { TdaoMysql } from '../../../dao/TdaoMysql';
export declare class TagentsDao extends TdaoMysql {
    constructor(objectClassName: any, datasource: any, config: any);
    getByHostAndPort(host: any, port: any, status: any): any;
}
