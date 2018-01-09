"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TbaseService_1 = require("../TbaseService");
const Ttimer_1 = require("../../tools/Ttimer");
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const Tscheduler_1 = require("./Tscheduler");
const Tworker_1 = require("./Tworker");
const TpluginsManager_1 = require("./TpluginsManager");
const TservicesDao_1 = require("./dao/TservicesDao");
const TcommandsDao_1 = require("./dao/TcommandsDao");
const TagentsService_1 = require("./agents/TagentsService");
const TagentsEndpoint_1 = require("./agents/TagentsEndpoint");
const TserviceCommand_1 = require("./crudServices/TserviceCommand");
class Tchecker extends TbaseService_1.TbaseService {
    constructor(name, server, config) {
        super(name, config);
        this.statTimerIterval = 2;
        this.lastStat = null;
        this.requestRate = 0;
        this.pubSubServer = null;
        this.httpServer = server;
        this.app = express();
        this.pubSubServer = config.pubSubServer;
        this.app.use(bodyParser.json({
            limit: '50mb'
        }));
        this.app.post('/savePlugin', this.savePlugin.bind(this));
        this.app.get('/generateServices', this.generateServices.bind(this));
        this.app.post('/workers/:id/kill', this.killWorker.bind(this));
        this.app.post('/workers/killall', this.killAllWorker.bind(this));
        this.app.post('/workers/config', this.setWorkersConfig.bind(this));
        this.app.get('/workers/config', this.getWorkersConfig.bind(this));
        this.app.post('/scheduler/config', this.setSchedulerConfig.bind(this));
        this.app.get('/scheduler/config', this.getSchedulerConfig.bind(this));
        this.app.get('/check', this.check.bind(this));
        this.app.head('/', this.head.bind(this));
        this.app.get('/', this.test.bind(this));
        this.httpServer.use(this.config.apiPath, this.app);
        app.config.models.Service.dao.class = TservicesDao_1.TservicesDao;
        app.config.models.Command.dao.class = TcommandsDao_1.TcommandsDao;
        this.daoServices = app.getDao("Service");
        app.ClusterManager.on("ISMASTER_CHANGED", this.onIsMasterChanged, this);
        this.redisClient = app.ClusterManager.getClient();
        this.pluginsManager = new TpluginsManager_1.TpluginsManager({
            maxSamePluginInstances: this.config.worker.maxSamePluginInstances
        });
        this.scheduler = new Tscheduler_1.Tscheduler(this.config.scheduler);
        this.scheduler.pubSubServer = this.pubSubServer;
        this.worker = new Tworker_1.Tworker(this.config.worker, this.pluginsManager);
        this.worker.pubSubServer = this.pubSubServer;
        this.statTimer = new Ttimer_1.Ttimer({ delay: this.statTimerIterval * 1000 });
        this.statTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onStatTimer, this);
        this.subscribeClient = app.ClusterManager.getNewClient();
        this.subscribeClient.on("subscribe", function (channel, count) {
            this.logger.info("subscribe success to " + channel);
        }.bind(this));
        this.subscribeClient.on("message", this.onBusMessage.bind(this));
        this.subscribeClient.subscribe("savePlugin");
        this.subscribeClient.subscribe("kill-worker");
        this.subscribeClient.subscribe("config");
    }
    static test() {
        app.logger.error("Appel methode statique");
    }
    static getCommandsServiceClass() {
        return TserviceCommand_1.TserviceCommand;
    }
    static getAgentsEndPointClass() {
        return TagentsEndpoint_1.TagentsEndpoint;
    }
    check(req, res) {
        res.status(200).send(req.user);
    }
    getDefaultConfig() {
        return {
            "active": false,
            "executionPolicy": "one_per_process",
            "apiPath": "/api/checker",
            "scheduler": {
                "statTimerInterval": 2000,
                "scheduleInterval": 1000,
                "maxQueueLength": 1000,
                "maxScheduleSize": 5,
                "scheduleOnlyIfQueueIsEmpty": false,
                "saveInterval": 2000
            },
            "worker": {
                "maxConcurrentRequests": 5,
                "statTimerInterval": 5000,
                "workInterval": 100,
                "maxSamePluginInstances": 20,
                "pluginTimeout": 40
            }
        };
    }
    start() {
        if (this.active) {
            this.worker.start();
            this.statTimer.start();
            this.lastStat = null;
            this.requestRate = 0;
            if (!this.agentsService) {
                this.agentsService = new TagentsService_1.TagentsService("agentsService", this.httpServer, {
                    apiPath: this.config.apiPath + "/agents_service"
                });
            }
            this.agentsService.start();
            super.start();
        }
    }
    stop() {
        super.stop();
        this.scheduler.stop();
        this.statTimer.stop();
        if (this.agentsService)
            this.agentsService.stop();
    }
    onBusMessage(channel, message) {
        if (!this.started)
            return;
        var messageObject = JSON.parse(message);
        this.logger.debug("message on channel " + channel);
        if (channel == "savePlugin") {
            this.pluginsManager.savePlugin(messageObject);
        }
        else if (channel == "kill-worker") {
            if (messageObject.nodeId == null) {
                setTimeout(function () {
                    process.exit(0);
                }, 1000);
            }
            else if (messageObject.nodeId == app.ClusterManager.nodeID) {
                this.logger.error("KILL NODE (id=" + messageObject.nodeId + ")");
                setTimeout(function () {
                    process.exit(0);
                }, 1000);
            }
        }
        else if (channel == "config") {
            if (messageObject.action == "update_workers_config")
                this.worker.setConfig(messageObject.config);
            else if (messageObject.action == "update_scheduler_config")
                this.scheduler.setConfig(messageObject.config);
        }
    }
    onIsMasterChanged(e) {
        this.logger.info("ISMASTER_CHANGED (process PID=" + process.pid + ", worker=" + process.pid + ") => " + e.data);
        if (e.data) {
            this.daoServices.reset().then(function (result) {
                if (this.active)
                    this.scheduler.start();
            }.bind(this), function (err) {
                if (this.active)
                    this.scheduler.start();
                this.logger.error("Tplugin.onIsMasterChanged.reset ERROR " + err);
            }.bind(this));
        }
        else {
            this.scheduler.stop();
        }
    }
    preProcess(req, res) {
        return true;
    }
    savePlugin(req, res) {
        if (!this.preProcess(req, res))
            return;
        this.logger.info("savePlugin");
        var pluginName = req.body.name;
        var pluginSource = req.body.source;
        this.redisClient.publish("savePlugin", JSON.stringify(req.body));
        res.status(200).send(req.body);
    }
    onStatTimer() {
        if (this.lastStat) {
            var now = new Date();
            var diff = now.getTime() - this.lastStat.getTime();
            this.lastStat = new Date();
        }
        else {
            this.lastStat = new Date();
        }
    }
    head(req, res) {
        this.preProcess(req, res);
        res.status("200").send("ok");
    }
    setSchedulerConfig(req, res, next) {
        var config = req.body;
        var message = {
            "action": "update_scheduler_config",
            "config": config
        };
        this.redisClient.publish("config", JSON.stringify(message), function (err, result) {
            res.status("200").send({ result: "submitted" });
        });
    }
    getSchedulerConfig(req, res, next) {
        res.status(200).send(this.config.scheduler);
    }
    setWorkersConfig(req, res, next) {
        var config = req.body;
        var message = {
            "action": "update_workers_config",
            "config": config
        };
        this.redisClient.publish("config", JSON.stringify(message), function (err, result) {
            res.status("200").send({ result: "submitted" });
        });
    }
    getWorkersConfig(req, res, next) {
        res.status(200).send(this.config.worker);
    }
    killAllWorker(req, res, next) {
        var nodeId = req.params.id;
        this.redisClient.publish("kill-worker", JSON.stringify({
            nodeId: null
        }), function (err, result) {
            res.status("200").send({ result: "submitted" });
        });
    }
    killWorker(req, res, next) {
        var nodeId = req.params.id;
        this.redisClient.publish("kill-worker", JSON.stringify({
            nodeId: nodeId
        }), function (err, result) {
            res.status("200").send({ result: "submitted" });
        });
    }
    generateServices(req, res) {
        var promises = [];
        var randId = Math.round(Math.random() * 100000);
        for (var i = 0; i < 100; i++) {
            var name = "CheckTomcatRequests_" + randId + "_" + i;
            var service = {
                enabled: true,
                name: name,
                args: {
                    url: "http://localhost:8090",
                    port: 8090
                },
                check_interval: 2,
                id_command: 13
            };
            promises.push(this.daoServices.save(service));
        }
        Promise.all(promises)
            .then(function (results) {
            this.logger.error("Nombre de services créés: " + results.length);
            res.send(results);
        }.bind(this), function (err) {
            this.logger.error("error " + err.toString());
            res.status(500).send(err);
        }.bind(this));
    }
    test(req, res) {
    }
}
exports.Tchecker = Tchecker;
//# sourceMappingURL=Tchecker.js.map