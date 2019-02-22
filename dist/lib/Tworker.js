"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var TeventDispatcher = turbine.events.TeventDispatcher;
var Ttimer = turbine.tools.Ttimer;
var tools = turbine.tools;
const Promise = require("bluebird");
const osUtils = require("os-utils");
const os = require("os");
class Tworker extends TeventDispatcher {
    constructor(config, pluginsManager) {
        super();
        this.daoClass = "Service";
        this.runningRequestsCount = 0;
        this.totalRequestsCount = 0;
        this.totalRequestsCompletedCount = 0;
        this.lastStat = null;
        Promise.config({
            cancellation: true
        });
        this.config = config;
        this.pluginsManager = pluginsManager;
        this.logger = app.getLogger(this.constructor.name);
        this.logger.debug(this.constructor.name + " created: opt=", this.config);
        this.logger.info("******* Tworker.config.maxConcurrentRequests = " + this.config.maxConcurrentRequests);
        this.redisClient = app.ClusterManager.getClient();
        app.getDao(this.daoClass)
            .then((dao) => {
            this.daoServices = dao;
        });
        app.getDao("x_service_parents")
            .then((dao) => {
            this.daox_service_parents = dao;
        });
        this.statTimer = new Ttimer({ delay: this.config.statTimerInterval });
        this.statTimer.on(Ttimer.ON_TIMER, this.onStatTimer, this);
        this.workTimer = new Ttimer({ delay: this.config.workInterval });
        this.workTimer.on(Ttimer.ON_TIMER, this.onWorkTimer, this);
    }
    setConfig(config) {
        if ((config.maxSamePluginInstances) && (config.maxSamePluginInstances != this.config.maxSamePluginInstances)) {
            this.config.maxSamePluginInstances = config.maxSamePluginInstances;
            this.pluginsManager.config.maxSamePluginInstances = this.config.maxSamePluginInstances;
            this.pluginsManager.freeAllPluginInstances();
        }
        for (var k in config)
            this.config[k] = config[k];
        this.statTimer.delay = this.config.statTimerInterval;
        this.statTimer.reset();
        this.workTimer.delay = this.config.workInterval;
        this.workTimer.reset();
        this.logger.info("UPDATE CONFIG", config);
        if (app.ClusterManager.isClusterMaster && this.pubSubServer)
            this.pubSubServer.broadcast({ type: 'publish', channel: "topvision.checker.workers.config", payload: this.config });
    }
    start() {
        this.statTimer.start();
        this.workTimer.start();
    }
    stop() {
        this.statTimer.stop();
        this.workTimer.stop();
    }
    onWorkTimer() {
        if (this.runningRequestsCount >= this.config.maxConcurrentRequests)
            return;
        this.redisClient.lpop("queue", (error, service) => {
            if (error) {
                this.logger.error(error);
            }
            else {
                if (service == null) {
                    this.logger.trace("QUEUE : NO ITEM LEFT");
                }
                else {
                    this.runningRequestsCount++;
                    this.totalRequestsCount++;
                    service = JSON.parse(service);
                    this.check(service, null, (result) => {
                        this.runningRequestsCount--;
                        this.totalRequestsCompletedCount++;
                        this.saveResultInRedis(result);
                    });
                }
            }
        });
    }
    getChildren(id) {
        return this.daox_service_parents.select({
            where: "id_parent=" + id
        })
            .then((results) => {
            var ids = [];
            for (var i = 0; i < results.length; i++) {
                ids.push(results[i].id_service);
            }
            return this.daoServices.getByIds(ids);
        });
    }
    saveResultInRedis(result) {
        result = JSON.stringify(result);
        this.redisClient.rpush("results", result, (err, result) => {
            if (err) {
                this.logger.error("Echec stockage du résultat dans REDIS. Ecriture directe en base (moins performant)");
                this.daoServices.saveCheckResults([result]);
            }
        });
    }
    getErrorMessage(err) {
        var r = "";
        if (typeof err == "object") {
            if (err.message) {
                r = err.message;
            }
            else {
                r = err.toString();
                if (r == "[object Object]")
                    r = JSON.stringify(err);
            }
        }
        else {
            r = err;
        }
        return r;
    }
    check(service, children, onCompleted) {
        var r = {
            serviceId: service.id,
            output: "",
            exitCode: 3,
            previousCheckTime: service.last_check,
            checkTime: new Date(),
            args: service.args,
            perfdata: null,
            ellapsed: null,
            parentsCount: service.parentsCount,
            childrenCount: service.childrenCount,
            old: {
                current_state: service.current_state
            }
        };
        var plugin = null;
        return this.pluginsManager.getPlugin(service.command_name)
            .then((result) => {
            plugin = result;
            if (service.childrenCount > 0) {
                return this.getChildren(service.id);
            }
            else {
                return Promise.resolve(null);
            }
        })
            .then((children) => {
            var start = new Date().getTime();
            var args = tools.array_replace_recursive(plugin.command.args, service.args);
            r.args = args;
            if (children)
                args.children = children;
            var promise = plugin._exec(args, service)
                .then((result) => {
                if (typeof result == "undefined") {
                    r.output = "plugin " + plugin.name + " result is undefined";
                    r.exitCode = 3;
                }
                else {
                    if (typeof result.exitCode == 'number') {
                        r.exitCode = result.exitCode;
                        if ((r.exitCode < 0) || (r.exitCode > 3))
                            r.exitCode = 3;
                    }
                    r.output = result.output;
                    if (result.perfdata)
                        r.perfdata = result.perfdata;
                    else
                        r.perfdata = null;
                }
            })
                .timeout(this.config.pluginTimeout * 1000)
                .catch(Promise.TimeoutError, (e) => {
                r.exitCode = 3;
                r.output = "operation timeout after " + this.config.pluginTimeout + " sec";
            })
                .catch((err) => {
                this.logger.error(service.command_name + " plugin.exec error", err.toString());
                r.exitCode = 3;
                r.output = this.getErrorMessage(err);
            })
                .finally(() => {
                this.pluginsManager.releaseInstance(plugin);
                r.ellapsed = new Date().getTime() - start;
                onCompleted(r);
            });
        })
            .catch((err) => {
            var errorMessage = "Cannot load plugin " + service.command_name + ": " + err + " (worker: " + os.hostname() + ":" + process.pid + ")";
            this.logger.error(errorMessage);
            r.output = errorMessage;
            onCompleted(r);
        });
    }
    onStatTimer() {
        if (this.runningRequestsCount >= this.config.maxConcurrentRequests) {
            this.logger.warn("worker " + process.pid + ": max Concurrent tasks reached (" + this.runningRequestsCount + ")");
        }
        else {
            this.logger.debug("worker " + process.pid + ": runningRequestsCount=" + this.runningRequestsCount);
        }
        this.logger.debug("worker " + process.pid + ": requestsCompleted=" + this.totalRequestsCompletedCount + "/" + this.totalRequestsCount);
        if (this.lastStat) {
            var now = new Date();
            var diff = now.getTime() - this.lastStat.getTime();
            this.requestRate = Math.round((this.totalRequestsCompletedCount / (diff / 1000)) * 10) / 10;
            var completedRate = Math.round(100 * this.totalRequestsCompletedCount / this.totalRequestsCount);
            if (this.requestRate > 0)
                this.logger.debug("requestRate=" + this.requestRate + "/sec, completedRate=" + completedRate + "%, running=" + this.runningRequestsCount);
            var data = {
                nodeID: app.ClusterManager.nodeID,
                timestamp: now.getTime(),
                hostname: os.hostname(),
                pid: process.pid,
                isMaster: app.ClusterManager.isClusterMaster,
                isServerMaster: app.ClusterManager.isServerMaster,
                stats: {
                    rate: this.requestRate,
                    completedRate: completedRate,
                    totalRequestsCount: this.totalRequestsCount,
                    runningRequestsCount: this.runningRequestsCount,
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: null
                }
            };
            this.lastStat = now;
            this.totalRequestsCount = 0;
            this.totalRequestsCompletedCount = 0;
            osUtils.cpuUsage((v) => {
                data.stats.cpuUsage = v * 100;
                this.redisClient.hset("workers.infos", app.ClusterManager.nodeID, JSON.stringify(data));
            });
        }
        else {
            this.lastStat = new Date();
        }
    }
}
exports.Tworker = Tworker;
//# sourceMappingURL=Tworker.js.map