"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
const Promise = require("bluebird");
const fs = require("fs");
var TeventDispatcher = turbine.events.TeventDispatcher;
var Ttimer = turbine.tools.Ttimer;
const uuid = require("uuid");
const shell = require("shelljs");
const genericPool = require("generic-pool");
const genericPoolErrors = require("generic-pool/lib/errors");
class TpluginsManager extends TeventDispatcher {
    constructor(config) {
        super();
        this.pools = {};
        this.poolTimerInterval = 5000;
        this.poolTimer = null;
        Promise.config({
            cancellation: true
        });
        this.config = this.getDefaultConfig();
        if (config) {
            for (var k in config)
                this.config[k] = config[k];
        }
        this.logger = app.getLogger(this.constructor.name);
        app.getDao("Command")
            .then((dao) => {
            this.daoCommands = dao;
        });
        this.poolTimer = new Ttimer({ delay: this.poolTimerInterval });
        this.poolTimer.on(Ttimer.ON_TIMER, this.onTimer, this);
        this.poolTimer.start();
    }
    getDefaultConfig() {
        return {
            pluginsPath: './plugins',
            maxSamePluginInstances: 10
        };
    }
    onTimer() {
        for (var name in this.pools) {
            var pool = this.pools[name];
            if (pool && (pool.pending > 0))
                this.logger.warn("Pool '" + name + "': " + pool.pending + " pending tasks. working:" + pool.borrowed + ", max pool size: " + pool.max);
        }
    }
    freeAllInstances(name) {
        this.logger.info("freeAllInstances('" + name + "')");
        if (this.pools[name]) {
            this.logger.error("clear pool " + name);
            this.pools[name].clear();
            this.pools[name] = null;
            delete require.cache[require.resolve(this.config.pluginsPath + '/' + name + '/plugin.js')];
        }
    }
    freeAllPluginInstances() {
        this.logger.info("freeAllPluginInstances");
        for (var name in this.pools)
            this.freeAllInstances(name);
    }
    savePlugin(plugin) {
        var pluginDirectory = __dirname + '/plugins/' + plugin.name;
        fs.stat(pluginDirectory, (err, stat) => {
            if (err == null) {
                this.logger.info('savePlugin : directory exists');
            }
            else if (err.code == 'ENOENT') {
                shell.mkdir('-p', pluginDirectory);
                this.logger.info('savePlugin : directory created');
            }
            else {
                this.logger.error(err, 'savePlugin');
                return;
            }
            var path = pluginDirectory + '/plugin.js';
            fs.writeFileSync(path, plugin.source);
            this.freeAllInstances(plugin.name);
        });
    }
    getPool(name) {
        if (this.pools[name]) {
            return Promise.resolve(this.pools[name]);
        }
        else {
            return this.daoCommands.getByName(name).then((command) => {
                this.logger.info("Creating plugins pool '" + name + "' (size: " + this.config.maxSamePluginInstances + ")");
                var pluginClass = require('./plugins/' + name + '/plugin.js');
                var factory = {
                    create: () => {
                        return new Promise((resolve, reject) => {
                            var instance = new pluginClass({});
                            instance.uid = uuid.v4();
                            instance.name = name;
                            instance.command = command;
                            resolve(instance);
                        });
                    },
                    destroy: (instance) => {
                        return new Promise((resolve) => {
                            instance.release();
                            instance.free();
                            resolve();
                        });
                    }
                };
                var opts = {
                    maxWaitingClients: 20,
                    acquireTimeoutMillis: 5000,
                    max: this.config.maxSamePluginInstances,
                    min: 0
                };
                this.pools[name] = genericPool.createPool(factory, opts);
                return this.pools[name];
            }, (err) => {
                this.logger.error("getPool: Command load error", err);
                throw err;
            });
        }
    }
    getPlugin(name) {
        if (name == null) {
            return Promise.reject("Plugin '" + name + "' not found");
        }
        else {
            return this.getPool(name)
                .then((pool) => {
                return pool.acquire();
            })
                .catch(genericPoolErrors.TimeoutError, (e) => {
                throw "timeout while acquiring plugin after 5 sec";
            });
        }
    }
    releaseInstance(instance) {
        if (!instance.isDestroyed)
            instance.release(instance);
        if (this.pools[instance.name])
            this.pools[instance.name].release(instance)
                .catch(err => {
                this.logger.debug("releaseInstance " + instance.name + ": " + err.toString());
            });
    }
}
exports.TpluginsManager = TpluginsManager;
//# sourceMappingURL=TpluginsManager2.js.map