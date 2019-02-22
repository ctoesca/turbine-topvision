"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var TeventDispatcher = turbine.events.TeventDispatcher;
var Ttimer = turbine.tools.Ttimer;
const Promise = require("bluebird");
class Tscheduler extends TeventDispatcher {
    constructor(config) {
        super();
        this.saving = false;
        this.daoClass = "Service";
        this.scheduling = 0;
        this.queueLength = null;
        this.lastStat = null;
        this.savingResults = false;
        this.resultsCount = 0;
        this.config = config;
        Promise.config({
            cancellation: true
        });
        this.logger = app.getLogger(this.constructor.name);
        this.logger.debug(this.constructor.name + " created");
        this.redisClient = app.ClusterManager.getClient();
        app.getDao(this.daoClass).then((dao) => {
            this.daoServices = dao;
        });
        this.statTimer = new Ttimer({ delay: this.config.statTimerInterval });
        this.statTimer.on(Ttimer.ON_TIMER, this.onStatTimer, this);
        this.scheduleTimer = new Ttimer({ delay: this.config.scheduleInterval });
        this.scheduleTimer.on(Ttimer.ON_TIMER, this.onScheduleTimer, this);
        this.saveTimer = new Ttimer({ delay: this.config.saveInterval });
        this.saveTimer.on(Ttimer.ON_TIMER, this.onSaveTimer, this);
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
        this.statTimer.reset();
        this.scheduleTimer.delay = this.config.scheduleInterval;
        this.saveTimer.delay = this.config.saveInterval;
        this.saveTimer.reset();
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
        var idList = [];
        var servicesListJson = [];
        var p = this.redisClient.llen("queue")
            .then(result => {
            this.queueLength = result;
            if (this.config.scheduleOnlyIfQueueIsEmpty && (this.queueLength > 0)) {
                this.logger.debug("Queue is not empty: schedule cancelled");
                return;
            }
            var limit = this.config.maxQueueLength - this.queueLength;
            if (limit <= 0)
                return;
            if (limit > this.config.maxScheduleSize)
                limit = this.config.maxScheduleSize;
            return app.getDao(this.daoClass).then((dao) => {
                this.daoServices = dao;
                return dao.getServicesToCheck({ limit: limit });
            });
        })
            .then(services => {
            if (services)
                return this.pushToQueue(services);
        })
            .catch(err => {
            this.logger.error("onScheduleTimer ERROR: ", err);
        })
            .finally(() => {
            this.scheduling--;
        });
    }
    pushToQueue(services) {
        var servicesListJson = [];
        var idList = [];
        for (var i = 0; i < services.length; i++) {
            var service = services[i];
            if (service.scheduled == false) {
                idList.push(service[this.daoServices.IDField].toString());
                servicesListJson.push(JSON.stringify(service));
            }
        }
        if (servicesListJson.length > 0) {
            return this.daoServices.setScheduled(idList, true)
                .then(() => {
                return this.redisClient.rpush("queue", servicesListJson);
            })
                .then(() => {
                this.logger.debug("Add " + idList.length + " to queue");
                return Promise.resolve();
            })
                .catch(error => {
                this.logger.error(error);
                return this.daoServices.setScheduled(idList, false);
            });
        }
        else {
            return Promise.resolve();
        }
    }
    saveResults() {
        if (this.savingResults) {
            this.logger.warn("Save is already running");
            return;
        }
        this.savingResults = true;
        var resultsToSave = null;
        var len = 0;
        var servicesIds = [];
        this.redisClient.llen("results")
            .then(result => {
            len = result;
            this.logger.debug("Saving " + len + " results...");
            if (len > 0)
                return this.redisClient.lrange("results", 0, len - 1);
        })
            .then(results => {
            if (results && (results.length > 0)) {
                resultsToSave = [];
                for (var i = 0; i < results.length; i++) {
                    var result = JSON.parse(results[i]);
                    resultsToSave.push(result);
                }
                return this.daoServices.saveCheckResults(resultsToSave)
                    .catch(err => {
                    this.logger.error("ECHEC enregistrement des résultats en base: les services concernés vont être déverrouilés");
                    var idList = [];
                    for (var i = 0; i < resultsToSave.length; i++) {
                        var resultToSave = resultsToSave[i];
                        idList.push(resultToSave.serviceId);
                    }
                    return this.daoServices.setScheduled(idList, false)
                        .then(() => {
                        throw err;
                    });
                })
                    .then((updated) => {
                    this.resultsCount += updated.length;
                    for (var i = 0; i < resultsToSave.length; i++) {
                        var result = resultsToSave[i];
                        if ((result.parentsCount > 0) && (result.old.current_state != result.exitCode)) {
                            servicesIds.push(result.serviceId);
                        }
                    }
                    return this.daoServices.getUniqueParents(servicesIds);
                })
                    .then((parents) => {
                    if (parents.length > 0) {
                        this.pushToQueue(parents);
                        this.logger.debug("ADD " + parents.length + " PARENTS TO QUEUE..." + servicesIds.join(','), parents);
                    }
                });
            }
        })
            .catch(err => {
            this.logger.error("Tscheduler.saveResults", err);
        })
            .finally(() => {
            this.savingResults = false;
            if (len > 0)
                this.redisClient.ltrim("results", len, -1);
        });
    }
    getSaveQueueLength() {
        return new Promise((resolve, reject) => {
            this.redisClient.llen("results", (error, len) => {
                if (error)
                    reject(error);
                else
                    resolve(len);
            });
        });
    }
    onSaveTimer() {
        this.saveResults();
    }
    onStatTimer() {
        if (this.lastStat) {
            this.redisClient.llen("queue", (error, result) => {
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
                    this.getSaveQueueLength().then((count) => {
                        payload.data.saveQueueLength = count;
                        return this.daoServices.query("select SUM(retard)/(select count(*) from view_services where enabled=1) as latency from view_services where retard >=0 AND enabled=1");
                    })
                        .then((result) => {
                        if (result[0].latency == null)
                            result[0].latency = 0;
                        payload.data.latency = Math.round(result[0].latency * 10) / 10;
                        return this.daoServices.query("select MAX(retard) as maxLatency from view_services where retard >=0 AND enabled=1");
                    })
                        .then((result) => {
                        if (result[0].maxLatency == null)
                            result[0].maxLatency = 0;
                        payload.data.maxLatency = Math.round(result[0].maxLatency * 10) / 10;
                        return this.daoServices.query("select COUNT(*) as scheduled from services where scheduled >0 AND enabled=1");
                    })
                        .then((result) => {
                        payload.data.scheduledCount = result[0].scheduled;
                        return this.daoServices.query("select AVG(check_interval) as avg_check_interval from services where enabled=1");
                    })
                        .then((result) => {
                        payload.data.avgCheckInterval = Math.round(10 * result[0].avg_check_interval) / 10;
                        return this.daoServices.query("select COUNT(*) as enabledServicesCount from services where enabled=1");
                    })
                        .then((result) => {
                        payload.data.enabledServicesCount = result[0].enabledServicesCount;
                        var sql = `select 
						count(*) as count,
						check_interval,
						count(*)/check_interval as avg
						from services svc where enabled=1 group by check_interval`;
                        return this.daoServices.query(sql);
                    })
                        .then((result) => {
                        var idealRate = 0;
                        for (var i = 0; i < result.length; i++)
                            idealRate += result[i].avg;
                        idealRate = Math.floor(idealRate) + 1;
                        payload.data.idealRate = idealRate;
                        var key = "workers.infos";
                        this.redisClient.hgetall(key, (err, result) => {
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
                                this.pubSubServer.broadcast({ type: 'publish', channel: "topvision.checker.stats", payload: payload });
                            }
                        });
                    });
                }
            });
        }
        else {
            this.lastStat = new Date();
        }
    }
}
exports.Tscheduler = Tscheduler;
//# sourceMappingURL=Tscheduler.js.map