"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TeventDispatcher_1 = require("../../events/TeventDispatcher");
const Ttimer_1 = require("../../tools/Ttimer");
const Promise = require("bluebird");
class Tscheduler extends TeventDispatcher_1.TeventDispatcher {
    constructor(config) {
        super();
        this.saving = false;
        this.daoClass = "Service";
        this.scheduling = 0;
        this.queueLength = null;
        this.lastStat = null;
        this.savingResults = false;
        this.resultsCount = 0;
        this.pubSubServer = null;
        this.config = config;
        this.logger = app.getLogger(this.constructor.name);
        this.logger.debug(this.constructor.name + " created");
        this.redisClient = app.ClusterManager.getClient();
        this.daoServices = app.getDao(this.daoClass);
        this.statTimer = new Ttimer_1.Ttimer({ delay: this.config.statTimerInterval });
        this.statTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onStatTimer, this);
        this.scheduleTimer = new Ttimer_1.Ttimer({ delay: this.config.scheduleInterval });
        this.scheduleTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onScheduleTimer, this);
        this.saveTimer = new Ttimer_1.Ttimer({ delay: this.config.saveInterval });
        this.saveTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onSaveTimer, this);
    }
    start() {
        this.statTimer.start();
        this.scheduleTimer.start();
        this.saveTimer.start();
        this.resultsCount = 0;
    }
    stop() {
        this.statTimer.stop();
        this.scheduleTimer.stop();
        this.saveTimer.stop();
    }
    setConfig(config) {
        this.logger.info("UPDATE CONFIG", config);
        for (var k in config)
            this.config[k] = config[k];
        this.statTimer.delay = this.config.statTimerInterval;
        this.scheduleTimer.delay = this.config.scheduleInterval;
        this.saveTimer.delay = this.config.saveInterval;
        if (app.ClusterManager.isClusterMaster && this.pubSubServer)
            this.pubSubServer.broadcast({ type: 'publish', channel: "topvision.checker.scheduler.config", payload: this.config });
    }
    onScheduleTimer() {
        if (app.ClusterManager.isClusterMaster == false) {
            this.stop();
            return;
        }
        if (this.scheduling > 0) {
            this.logger.warn(this.scheduling + " Scheduling is already running. NODEID=" + app.ClusterManager.nodeID);
            return;
        }
        this.scheduling++;
        this.redisClient.llen("queue", function (error, result) {
            if (error) {
                this.logger.error(error, "onScheduleTimer");
                this.scheduling--;
            }
            else {
                this.queueLength = result;
                if (this.config.scheduleOnlyIfQueueIsEmpty && (this.queueLength > 0)) {
                    this.logger.debug("Queue is not empty: schedule cancelled");
                    this.scheduling--;
                    return;
                }
                var limit = this.config.maxQueueLength;
                limit = this.config.maxQueueLength - this.queueLength;
                if (limit <= 0) {
                    this.scheduling--;
                    return;
                }
                if (limit > this.config.maxScheduleSize)
                    limit = this.config.maxScheduleSize;
                this.daoServices.getServicesToCheck({ limit: limit })
                    .then(function (services) {
                    var idList = [];
                    var servicesListJson = [];
                    for (var i = 0; i < services.length; i++) {
                        var service = services[i];
                        idList.push(service[this.daoServices.IDField].toString());
                        servicesListJson.push(JSON.stringify(service));
                    }
                    if (servicesListJson.length > 0) {
                        this.daoServices.setScheduled(idList, true).then(function (result) {
                            this.scheduling--;
                            this.redisClient.rpush("queue", servicesListJson, function (error, result) {
                                if (error) {
                                    this.logger.error(error);
                                    this.daoServices.setScheduled(idList, false);
                                }
                            }.bind(this));
                            this.logger.debug("Add " + idList.length + " to queue");
                        }.bind(this), function (err) {
                            this.scheduling--;
                        }.bind(this));
                    }
                    else {
                        this.scheduling--;
                    }
                }.bind(this), function (err) {
                    this.logger.error("onScheduleTimer.getServicesToCheck ERROR: " + err);
                    this.scheduling--;
                }.bind(this));
            }
        }.bind(this));
    }
    saveResults() {
        if (this.savingResults) {
            this.logger.warn("Save is already running");
            return;
        }
        this.savingResults = true;
        this.redisClient.llen("results", function (error, len) {
            if (error) {
                this.logger.error("llen(results)", error);
                this.savingResults = false;
            }
            else {
                this.logger.debug("Saving " + len + " results...");
                this.redisClient.lrange("results", 0, len - 1, function (error, results) {
                    if (error) {
                        this.logger.error(error);
                        this.savingResults = false;
                    }
                    else {
                        if ((results == null) || (results.length == 0)) {
                            this.savingResults = false;
                        }
                        else {
                            for (var i = 0; i < results.length; i++)
                                results[i] = JSON.parse(results[i]);
                            this.daoServices.saveServices(results).then(function (saveresult) {
                                this.resultsCount += results.length;
                                this.savingResults = false;
                                this.logger.debug("Saved " + results.length + " items");
                                this.redisClient.ltrim("results", len, -1, function (error, ltrimresult) {
                                    if (error)
                                        this.logger.error(error);
                                }.bind(this));
                            }.bind(this), function (err) {
                                this.logger.error("Tscheduler.saveResults: " + err);
                                this.daoServices.reset().then(function () {
                                    this.savingResults = false;
                                }.bind(this), function (err) {
                                    this.logger.error("Error RESET: " + err);
                                    this.savingResults = false;
                                }.bind(this));
                                this.redisClient.ltrim("results", len, -1, function (error, ltrimresult) {
                                    if (error)
                                        this.logger.error(error);
                                }.bind(this));
                            }.bind(this));
                        }
                    }
                }.bind(this));
            }
        }.bind(this));
    }
    getSaveQueueLength() {
        return new Promise(function (resolve, reject) {
            this.redisClient.llen("results", function (error, len) {
                if (error)
                    reject(error);
                else
                    resolve(len);
            });
        }.bind(this));
    }
    onSaveTimer() {
        this.saveResults();
    }
    onStatTimer() {
        if (this.lastStat) {
            this.redisClient.llen("queue", function (error, result) {
                if (!error) {
                    this.queueLength = result;
                    var now = new Date();
                    var diff = now.getTime() - this.lastStat.getTime();
                    var saveRate = Math.round(this.resultsCount / (diff / 1000));
                    this.lastStat = new Date();
                    this.logger.info("Queue length: " + this.queueLength + " (max=" + this.config.maxQueueLength + ") SAVE RATE=" + saveRate + "/sec");
                    this.resultsCount = 0;
                    var payload = {
                        data: {
                            saveQueueLength: 0,
                            saveRate: saveRate,
                            checkRate: 0,
                            queueLength: this.queueLength,
                            maxQueueLength: this.config.maxQueueLength,
                            idealRate: 0,
                            workers: [],
                            latency: 0,
                            maxLatency: 0,
                            scheduledCount: 0,
                            avgCheckInterval: 0,
                            enabledServicesCount: 0
                        }
                    };
                    this.getSaveQueueLength().then(function (count) {
                        payload.data.saveQueueLength = count;
                        return this.daoServices.query("select AVG(retard) as latency from view_services where retard >=0 AND enabled=1");
                    }.bind(this))
                        .then(function (result) {
                        if (result[0].latency == null)
                            result[0].latency = 0;
                        payload.data.latency = Math.round(result[0].latency * 10) / 10;
                        return this.daoServices.query("select MAX(retard) as maxLatency from view_services where retard >0 AND enabled=1");
                    }.bind(this))
                        .then(function (result) {
                        if (result[0].maxLatency == null)
                            result[0].maxLatency = 0;
                        payload.data.maxLatency = Math.round(result[0].maxLatency * 10) / 10;
                        return this.daoServices.query("select COUNT(*) as scheduled from services where scheduled >0 AND enabled=1");
                    }.bind(this))
                        .then(function (result) {
                        payload.data.scheduledCount = result[0].scheduled;
                        return this.daoServices.query("select AVG(check_interval) as avg_check_interval from services where enabled=1");
                    }.bind(this))
                        .then(function (result) {
                        payload.data.avgCheckInterval = Math.round(10 * result[0].avg_check_interval) / 10;
                        return this.daoServices.query("select COUNT(*) as enabledServicesCount from services where enabled=1");
                    }.bind(this))
                        .then(function (result) {
                        payload.data.enabledServicesCount = result[0].enabledServicesCount;
                        var sql = `select 
						count(*) as count,
						check_interval,
						count(*)/check_interval as avg
						from services svc where enabled=1 group by check_interval`;
                        return this.daoServices.query(sql);
                    }.bind(this))
                        .then(function (result) {
                        var idealRate = 0;
                        for (var i = 0; i < result.length; i++)
                            idealRate += result[i].avg;
                        idealRate = Math.floor(idealRate) + 1;
                        payload.data.idealRate = idealRate;
                        var key = "workers.infos";
                        this.redisClient.hgetall(key, function (err, result) {
                            for (var k in result) {
                                var item = JSON.parse(result[k]);
                                var deleteItem = false;
                                if (typeof item.timestamp != "number") {
                                    this.logger.error(key + "." + k + ": timestamp n'est pas un entier: " + timestamp);
                                    deleteItem = true;
                                }
                                else {
                                    var timestamp = item.timestamp;
                                    if ((new Date().getTime() - timestamp) > 10000) {
                                        deleteItem = true;
                                    }
                                    else {
                                        payload.data.workers.push(item);
                                        payload.data.checkRate += item.stats.rate;
                                    }
                                }
                                if (deleteItem)
                                    this.redisClient.hdel(key, k);
                            }
                            payload.data.checkRate = Math.round(payload.data.checkRate * 10) / 10;
                            if (this.pubSubServer) {
                                this.pubSubServer.broadcast({ type: 'publish', channel: "strongbox.checker.stats", payload: payload });
                            }
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this));
        }
        else {
            this.lastStat = new Date();
        }
    }
}
exports.Tscheduler = Tscheduler;
//# sourceMappingURL=Tscheduler.js.map