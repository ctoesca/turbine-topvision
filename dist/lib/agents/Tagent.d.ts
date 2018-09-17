import * as turbine from "turbine";
import TeventDispatcher = turbine.events.TeventDispatcher;
import { TfsApi } from './TfsApi';
import { ThttpApi } from './ThttpApi';
import { TsshApi } from './TsshApi';
import * as Logger from "bunyan";
import Promise = require("bluebird");
export declare class Tagent extends TeventDispatcher {
    data: any;
    httpConnectTimeout: number;
    httpTimeout: number;
    fs: TfsApi;
    http: ThttpApi;
    ssh: TsshApi;
    dataService: any;
    logger: Logger;
    constructor(data: any);
    destroy(): void;
    readonly name: string;
    host: any;
    save(): any;
    getUrl(): string;
    stop(opt: any): Promise<{}>;
    setConfig(data: any, options?: any): Promise<{}>;
    getConfig(options?: any): Promise<{}>;
    checkPort(host: any, port: any, opt: any): Promise<{}>;
    check(): Promise<{}>;
    _call(method: any, url: any, data: any, httpOptions?: any): Promise<{}>;
}
