"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const fs = require("fs");
const TeventDispatcher_1 = require("../../events/TeventDispatcher");
const uuid = require("uuid");
const shell = require("shelljs");
class TpluginsManager extends TeventDispatcher_1.TeventDispatcher {
    constructor(config) {
        super();
        this.pluginsInstances = {};
        this.config = this.getDefaultConfig();
        if (config) {
            for (var k in config)
                this.config[k] = config[k];
        }
        this.logger = app.getLogger(this.constructor.name);
        this.daoCommands = app.getDao("Command");
    }
    getDefaultConfig() {
        return {
            pluginsPath: './plugins',
            maxSamePluginInstances: 10
        };
    }
    onTimer() {
        for (var name in this.pluginsInstances) {
            var freeInstances = this.pluginsInstances[name].freeInstances;
            if (freeInstances.length < this.config.maxSamePluginInstances / 3)
                this.logger.warn("plugin '" + name + "': " + freeInstances.length + " FREE instances");
        }
    }
    freeAllInstances(name) {
        this.logger.info("freeAllInstances('" + name + "')");
        if (this.pluginsInstances[name]) {
            for (var i = 0; i < this.pluginsInstances[name].instances.length; i++) {
                var inst = this.pluginsInstances[name].instances[i];
                this.releaseInstance(inst);
                inst.free();
            }
            this.pluginsInstances[name].instances = null;
            this.pluginsInstances[name].freeInstances = null;
            this.pluginsInstances[name] = null;
            delete this.pluginsInstances[name];
            delete require.cache[require.resolve(this.config.pluginsPath + '/' + name + '/plugin.js')];
        }
    }
    freeAllPluginInstances() {
        this.logger.info("freeAllPluginInstances");
        for (var name in this.pluginsInstances) {
            this.freeAllInstances(name);
        }
    }
    savePlugin(plugin) {
        var pluginDirectory = __dirname + '/plugins/' + plugin.name;
        fs.stat(pluginDirectory, function (err, stat) {
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
            if (this.pluginsInstances[plugin.name]) {
                this.freeAllInstances(plugin.name);
                this.createPluginsInstances(plugin.name);
            }
        }.bind(this));
    }
    createPluginsInstances(name) {
        if (this.pluginsInstances[name]) {
            return Promise.resolve(this.pluginsInstances[name]);
        }
        else {
            return this.daoCommands.getByName(name).then(function (command) {
                this.logger.info("Creating " + this.config.maxSamePluginInstances + " '" + name + "' plugin instances");
                var pluginClass = require('./plugins/' + name + '/plugin.js');
                for (var i = 0; i < this.config.maxSamePluginInstances; i++) {
                    var instance = new pluginClass({});
                    if (i == 0) {
                        this.pluginsInstances[name] = {
                            freeInstances: [],
                            instances: []
                        };
                    }
                    instance.uid = uuid.v4();
                    instance.name = name;
                    instance.command = command;
                    this.pluginsInstances[name].freeInstances.push(instance);
                    this.pluginsInstances[name].instances.push(instance);
                    this.logger.debug("CREATED plugin instance : " + name);
                }
                return this.pluginsInstances[name];
            }.bind(this), function (err) {
                this.logger.error("Command load error", err);
            }.bind(this));
        }
    }
    getPlugin(name) {
        return new Promise(function (resolve, reject) {
            if (name == null) {
                reject("Plugin '" + name + "' not found");
            }
            else {
                this.createPluginsInstances(name).then(function (result) {
                    if (typeof this.pluginsInstances[name] == "undefined") {
                        var m = "getPlugin: this.pluginsInstances[name] est indéfini";
                        this.logger.error(m);
                        reject(new Error(m));
                    }
                    else {
                        var freeInstances = this.pluginsInstances[name].freeInstances;
                        if (freeInstances.length == 0) {
                            var m = "Max instances has been reached for plugin " + name + " (x" + this.config.maxSamePluginInstances + ")";
                            this.logger.error(m);
                            reject(new Error(m));
                        }
                        else {
                            resolve(freeInstances.shift());
                        }
                    }
                }.bind(this), function (err) {
                    this.freeAllInstances(name);
                    this.logger.error("Load plugin '" + name + "' : " + err.toString());
                    this.logger.debug(err);
                    reject(err);
                }.bind(this));
            }
        }.bind(this));
    }
    releaseInstance(instance) {
        instance.release(instance);
        if (!instance.isDestroyed)
            this.pluginsInstances[instance.name].freeInstances.push(instance);
    }
}
exports.TpluginsManager = TpluginsManager;
//# sourceMappingURL=TpluginsManager.js.map