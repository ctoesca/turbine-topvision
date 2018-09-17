import * as turbine from "turbine";
import TeventDispatcher = turbine.events.TeventDispatcher;
import { Tagent } from './Tagent';
import Promise = require("bluebird");
export declare class TfsApi extends TeventDispatcher {
    agent: Tagent;
    constructor(agent: any, config: any);
    list(path: any, opt: any): Promise<{}>;
    fileinfo(path: any, opt: any): Promise<{}>;
    deleteFiles(path: any, opt: any): Promise<{}>;
    moveFile(path: any, dest: any, opt: any): Promise<{}>;
    download(remotePath: any, localPath: any, opt: any): Promise<{}>;
    upload(localPath: any, remotePath: any, opt: any): any;
    execScript(script: any, opt: any): Promise<any>;
    writeTextFile(path: any, content: any, opt: any): Promise<{}>;
}
