import { TeventDispatcher } from '../../../events/TeventDispatcher';
import { TfsApi } from './TfsApi';
import { ThttpApi } from './ThttpApi';
import { TsshApi } from './TsshApi';
import Logger = require("bunyan");
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
    stop(opt: any): any;
    setConfig(data: any, options?: any): any;
    getConfig(options?: any): any;
    checkPort(host: any, port: any, opt: any): any;
    check(): any;
    _call(method: any, url: any, data: any, httpOptions?: any): any;
}
