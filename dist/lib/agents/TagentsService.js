"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ttimer_1 = require("../../../tools/Ttimer");
const TbaseService_1 = require("../../TbaseService");
const Tagent_1 = require("./Tagent");
const TagentEvent_1 = require("./TagentEvent");
const Promise = require("bluebird");
const express = require("express");
class TagentsService extends TbaseService_1.TbaseService {
    constructor(name, server, config) {
        super(name, config);
        this.agentsInstances = [];
        this.invalidatedAgents = [];
        this.httpServer = server;
        this.app = express();
        this.app.get('/check', this.check.bind(this));
        this.httpServer.use(this.config.apiPath, this.app);
        this.dao = app.getDao("Agent");
        this.monitoringTimer = new Ttimer_1.Ttimer({ delay: 30000 });
        this.monitoringTimer.on(Ttimer_1.Ttimer.ON_TIMER, this.onMonitoringTimer, this);
    }
    createInstance(mixed, port, https) {
        if (typeof mixed == "object") {
            return new Promise(function (resolve, reject) {
                var agent = new Tagent_1.Tagent(mixed);
                agent.on(TagentEvent_1.TagentEvent.FAILURE, this.onAgentFailure.bind(this));
                this.agentsInstances.push(agent);
                resolve(agent);
            }.bind(this));
        }
        else {
            return new Promise(function (resolve, reject) {
                var agent = new Tagent_1.Tagent({
                    host: mixed,
                    port: port,
                    https: https
                });
                resolve(agent);
            }.bind(this));
        }
    }
    onAgentFailure(e) {
        var agent = e.currentTarget;
        this.logger.error("agent failure : " + agent.name + " err= " + e.data);
        this.invalidateAgent(agent);
        if (this.agentsInstances.length > 0) {
            this.logAgentsActifs();
            e.data.retryWith = this.getRandomItem(this.agentsInstances);
        }
    }
    getAgentInstance(host, port) {
        var r = null;
        for (var i = 0; i < this.agentsInstances.length; i++) {
            var agt = this.agentsInstances[i];
            if ((agt.data.port == port) && (agt.data.host == host)) {
                r = agt;
                break;
            }
        }
        return r;
    }
    getAgentInstanceIndex(array, host, port) {
        var r = null;
        for (var i = 0; i < array.length; i++) {
            var agt = array[i];
            if ((agt.data.port == port) && (agt.data.host == host)) {
                r = i;
                break;
            }
        }
        return r;
    }
    removeAgentInstance(array, agent) {
        var r = false;
        var indx = this.getAgentInstanceIndex(array, agent.data.host, agent.data.port);
        if (indx != null) {
            agent.destroy();
            array.splice(indx, 1);
            this.logger.error("AGENT " + agent.name + " INVALIDATED");
            r = true;
        }
        return r;
    }
    invalidateAgent(agent) {
        this.removeAgentInstance(this.agentsInstances, agent);
        this.invalidatedAgents.push(agent);
    }
    getRandomItem(array) {
        if (array.length == 0) {
            return null;
        }
        else {
            var k = Math.floor(Math.random() * array.length);
            return array[k];
        }
    }
    logAgentsActifs() {
        if (this.agentsInstances.length == 0) {
            this.logger.error("Aucun agent actif");
        }
        else {
            var m = "Agents actifs: ";
            for (var i = 0; i < this.agentsInstances.length; i++) {
                m += this.agentsInstances[i].name + " ";
            }
            ;
            this.logger.info(m);
        }
    }
    onMonitoringTimer() {
        this.loadAgents().then(function () {
        });
    }
    getAgentForHost(host, port) {
        if (this.agentsInstances.length > 0) {
            var r = this.getRandomItem(this.agentsInstances);
            return Promise.resolve(r);
        }
        else {
            return Promise.reject("Aucun agent actif");
        }
    }
    loadAgents() {
        return this.dao.select({
            where: "enabled=1"
        })
            .then(function (result) {
            if (result.length != 0) {
                this.agentsInstances = [];
                var promises = [];
                for (var i = 0; i < result.length; i++)
                    promises.push(this.createInstance(result[i]));
                return Promise.all(promises).then(function (agents) {
                    return this.getRandomItem(this.agentsInstances);
                }.bind(this));
            }
            else {
                this.logger.error("getAgentForHost: aucun agent disponible");
                return null;
            }
        }.bind(this));
    }
    getAgentByHostAndPort(host, port) {
        return this.dao.getByHostAndPort(host, port)
            .then(function (result) {
            if (result != null)
                return new Tagent_1.Tagent(result);
            else
                return null;
        });
    }
    getDefaultConfig() {
        return {
            "active": true,
            "executionPolicy": "one_per_process",
            "apiPath": "/api/agents"
        };
    }
    start() {
        if (this.active) {
            super.start();
            this.monitoringTimer.start();
        }
    }
    stop() {
        super.stop();
        this.monitoringTimer.stop();
    }
    check(req, res, next) {
        var https = (req.query.https != "false");
        var agent = new Tagent_1.Tagent({
            host: req.query.host,
            port: req.query.port,
            https: https
        });
        agent.check().then(function (result) {
            res.status(200).send(result);
        }, function (err) {
            res.status(500).send(err);
        });
    }
}
exports.TagentsService = TagentsService;
//# sourceMappingURL=TagentsService.js.map