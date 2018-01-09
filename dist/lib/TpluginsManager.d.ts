/// <reference types="bluebird" />
import * as turbine from "turbine";
import Promise = require("bluebird");
import TeventDispatcher = turbine.events.TeventDispatcher;
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
    getPlugin(name: any): Promise<{}>;
    releaseInstance(instance: any): void;
}
