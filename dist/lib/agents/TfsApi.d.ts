import { TeventDispatcher } from '../../../events/TeventDispatcher';
import { Tagent } from './Tagent';
export declare class TfsApi extends TeventDispatcher {
    agent: Tagent;
    constructor(agent: any, config: any);
    list(path: any, opt: any): any;
    fileinfo(path: any, opt: any): any;
    deleteFiles(path: any, opt: any): any;
    moveFile(path: any, dest: any, opt: any): any;
    download(remotePath: any, localPath: any, opt: any): any;
    upload(localPath: any, remotePath: any, opt: any): any;
    execScript(script: any, opt: any): any;
    writeTextFile(path: any, content: any, opt: any): any;
}
