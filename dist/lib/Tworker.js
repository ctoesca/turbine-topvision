"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TeventDispatcher_1 = require("../../events/TeventDispatcher");
const Ttimer_1 = require("../../tools/Ttimer");
const tools = require("../../tools");
const osUtils = require("os-utils");
const os = require("os");
class Tworker extends TeventDispatcher_1.TeventDispatcher {
    constructor(config, pluginsManager) {
        super();
        this.daoClass = "Service";
        this.runningRequestsCount = 0;
        this.totalRequestsCount = 0;
        this.totalRequestsCompletedCount = 0;
        this.lastStat = null;
        this.pubSubServer = null;
        this.config = config;
        this.pluginsManager = pluginsManager;
        this.logger = app.getLogger(this.constructor.name);
        this.logger.debug(this.constructor.name + " created: opt=", this.config);
        this.logger.info("******* Tworker.config.maxConcurrentRequests = " + this.config.maxConcurrentRequests);
        this.redisClient = app.ClusterManager.getClient();
        this.daoServices = app.getDao(this.daoClass);
        this.statTimer = new Ttimer_1.Ttimer({ delay: this.config.statTimerInterval });
        this.statTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onStatTimer, this);
        this.workTimer = new Ttimer_1.Ttimer({ delay: this.config.workInterval });
        this.workTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onWorkTimer, this);
    }
    setConfig(config) {
        if ((config.maxSamePluginInstances) && (config.maxSamePluginInstances != this.config.maxSamePluginInstances)) {
            this.config.maxSamePluginInstances = config.maxSamePluginInstances;
            this.pluginsManager.maxSamePluginInstances = this.config.maxSamePluginInstances;
            this.pluginsManager.freeAllPluginInstances();
        }
        for (var k in config)
            this.config[k] = config[k];
        this.statTimer.delay = this.config.statTimerInterval;
        this.workTimer.delay = this.config.workInterval;
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
        if (this.runningRequestsCount >= this.config.maxConcurrentRequests) {
            this.logger.debug("max Concurrent Requests reached (" + this.config.maxConcurrentRequests + ")");
            return;
        }
        this.redisClient.lpop("queue", function (error, result) {
            if (error) {
                this.logger.error(error);
            }
            else {
                if (result == null) {
                    this.logger.trace("QUEUE : NO ITEM LEFT");
                }
                else {
                    this.runningRequestsCount++;
                    this.totalRequestsCount++;
                    var item = JSON.parse(result);
                    this.logger.trace("QUEUE ITEM: " + item.name);
                    this.check(item, function (result) {
                        item.scheduled = 0;
                        item.previous_check = item.last_check;
                        item.last_check = new Date().getTime();
                        try {
                            item.output = result.output;
                            item.ellapsed = -1;
                            if (typeof result.exitCode != "undefined")
                                item.current_state = result.exitCode;
                            if (result.perfdata) {
                                item.perfdata = result.perfdata;
                                if (result.perfdata.ellapsed)
                                    item.ellapsed = result.perfdata.ellapsed;
                            }
                        }
                        catch (err) {
                            this.logger.error(err);
                            item.output = err.toString();
                            item.current_state = 3;
                            item.ellapsed = 0;
                        }
                        this.runningRequestsCount--;
                        this.totalRequestsCompletedCount++;
                        this.redisClient.rpush("results", JSON.stringify(item), function (err, result) {
                            if (err) {
                                this.logger.error("Echec stockage du résultat dans REDIS. Ecriture directe en base (moins performant)");
                                this.daoServices.saveServices([item]).then(function (saveresult) {
                                    this.logger.debug("Saved 1 item");
                                }.bind(this));
                            }
                        }.bind(this));
                    }.bind(this));
                }
            }
        }.bind(this));
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
    check(service, onCompleted) {
        this.pluginsManager.getPlugin(service.command_name).then(function (plugin) {
            try {
                var args = tools.array_replace_recursive(plugin.command.args, service.args);
                plugin._exec(args, this.config.pluginTimeout, service).then(function (r) {
                    this.pluginsManager.releaseInstance(plugin);
                    if (typeof r == "undefined") {
                        var m = "plugin " + plugin.name + " result is undefined";
                        this.logger.error(m);
                        throw m;
                    }
                    else {
                        if (r.exitCode < 0)
                            r.exitCode = 3;
                        else if (r.exitCode > 3)
                            r.exitCode = 3;
                        onCompleted(r);
                    }
                }.bind(this), function (err) {
                    this.pluginsManager.releaseInstance(plugin);
                    onCompleted({
                        output: this.getErrorMessage(err),
                        exitCode: 3,
                        lastCheck: new Date,
                        args: service.args,
                        perfdata: {
                            ellapsed: -1
                        }
                    });
                    if (err.toString().startsWith("TIMEOUT"))
                        this.logger.error("*****************  " + plugin.name + ": Timeout   **************");
                }.bind(this))
                    .catch(function (err) {
                    this.pluginsManager.releaseInstance(plugin);
                    this.logger.error(service.command_name + " plugin.exec.catch ", err.toString());
                    onCompleted({
                        output: this.getErrorMessage(err),
                        exitCode: 3,
                        lastCheck: new Date,
                        args: service.args,
                        perfdata: {
                            ellapsed: -1
                        }
                    });
                }.bind(this));
            }
            catch (err) {
                this.logger.error(plugin.name + " plugin.exec exception", err.toString());
                this.pluginsManager.releaseInstance(plugin);
                onCompleted({
                    output: this.getErrorMessage(err),
                    exitCode: 3,
                    lastCheck: new Date,
                    perfdata: {
                        ellapsed: -1
                    }
                });
            }
        }.bind(this), function (err) {
            var errorMessage = "Cannot load plugin " + service.command_name + ": " + err + " (worker: " + os.hostname() + ":" + process.pid + ")";
            this.logger.error(errorMessage);
            onCompleted({
                output: errorMessage,
                exitCode: 3,
                lastCheck: new Date,
                args: service.args,
                perfdata: {
                    ellapsed: 0
                }
            });
        }.bind(this));
    }
    onStatTimer() {
        if (this.runningRequestsCount >= this.config.maxConcurrentRequests) {
            this.logger.warn("worker " + process.pid + ": max Concurrent Requests reached (" + this.runningRequestsCount + ")");
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
            osUtils.cpuUsage(function (v) {
                data.stats.cpuUsage = v;
                this.redisClient.hset("workers.infos", app.ClusterManager.nodeID, JSON.stringify(data));
            }.bind(this));
        }
        else {
            this.lastStat = new Date();
        }
    }
}
exports.Tworker = Tworker;
//# sourceMappingURL=Tworker.js.map