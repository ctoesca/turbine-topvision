import * as turbine from "turbine";
import TeventDispatcher = turbine.events.TeventDispatcher;
import Ttimer = turbine.tools.Ttimer;
export declare class TpluginsManager extends TeventDispatcher {
    logger: any;
    daoCommands: any;
    config: any;
    pools: {};
    poolTimerInterval: number;
    poolTimer: Ttimer;
    constructor(config: any);
    getDefaultConfig(): {
        pluginsPath: string;
        maxSamePluginInstances: number;
    };
    onTimer(): void;
    freeAllInstances(name: any): void;
    freeAllPluginInstances(): void;
    savePlugin(plugin: any): void;
    getPool(name: any): any;
    getPlugin(name: any): any;
    releaseInstance(instance: any): void;
}
