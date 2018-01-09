import { TeventDispatcher } from '../../events/TeventDispatcher';
export declare class TpluginsManager extends TeventDispatcher {
    logger: any;
    pluginsInstances: {};
    daoCommands: any;
    config: any;
    constructor(config: any);
    getDefaultConfig(): {
        pluginsPath: string;
        maxSamePluginInstances: number;
    };
    onTimer(): void;
    freeAllInstances(name: any): void;
    freeAllPluginInstances(): void;
    savePlugin(plugin: any): void;
    createPluginsInstances(name: any): any;
    getPlugin(name: any): any;
    releaseInstance(instance: any): void;
}
