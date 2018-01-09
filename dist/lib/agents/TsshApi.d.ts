import { TeventDispatcher } from '../../../events/TeventDispatcher';
import { Tagent } from './Tagent';
export declare class TsshApi extends TeventDispatcher {
    agent: Tagent;
    constructor(agent: any, config: any);
    exec(opt: any): any;
    moveFile(path: any, dest: any, opt: any): any;
    download(remotePath: any, localPath: any, opt: any): any;
    upload(localPath: any, remotePath: any, opt: any): any;
    execScript(script: any, opt: any): any;
    writeTextFile(path: any, content: any, opt: any): any;
}
