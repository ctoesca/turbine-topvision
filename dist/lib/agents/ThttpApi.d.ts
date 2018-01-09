import { TeventDispatcher } from '../../../events/TeventDispatcher';
import { Tagent } from './Tagent';
export declare class ThttpApi extends TeventDispatcher {
    agent: Tagent;
    constructor(agent: any, config: any);
    request(opt: any): any;
    download(remotePath: any, localPath: any, opt: any): any;
    upload(localPath: any, remotePath: any, opt: any): any;
}
