import * as turbine from "turbine";
import TdaoMysql = turbine.dao.TdaoMysql;
import promise = require('bluebird');
export declare class TagentsDao extends TdaoMysql {
    constructor(objectClassName: any, datasource: any, config: any);
    getByHost(host: any): promise<object>;
    getByHostAndPort(host: any, port: any, status: any): promise<object>;
}
