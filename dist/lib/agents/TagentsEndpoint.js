"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TcrudRestEndpoint_1 = require("../../../rest/TcrudRestEndpoint");
const tools = require("../../../tools");
const url = require("url");
class TagentsEndpoint extends TcrudRestEndpoint_1.TcrudRestEndpoint {
    constructor(config) {
        super(config);
        this.startDate = null;
        this.logger = app.getLogger("TagentsEndpoint");
        this.app.post("/setConfig", this.setConfig.bind(this));
        this.app.post("/getConfig", this.getConfig.bind(this));
        this.app.get("/checkAgentByHostAndPort", this.checkAgentByHostAndPort.bind(this));
    }
    init() {
        super.init();
    }
    getAgentService() {
        var checker = app.getService("checker");
        return checker.agentsService;
    }
    checkAgentByHostAndPort(req, res, next) {
        var u = url.parse(req.url, true);
        var host = u.query.host;
        var port = u.query.port;
        var https = (u.query.https === "true");
        this.getAgentService().createInstance(host, port, https)
            .then(function (agent) {
            return agent.check();
        }.bind(this))
            .then(function (result) {
            res.send(result);
            this.saveAgentStatus(host, port, result);
        }.bind(this))
            .catch(function (err) {
            next(err);
            this.saveAgentStatus(host, port, {
                status: 2, error_message: err.toString()
            });
        }.bind(this));
    }
    saveAgentStatus(host, port, data) {
        this.getAgentService().getAgentByHostAndPort(host, port).then(function (agent) {
            if (agent != null) {
                if (data.version)
                    agent.data.version = data.version;
                agent.data.status = data.status;
                agent.save();
            }
        }.bind(this));
    }
    setConfig(req, res, next) {
        var host = req.body.host;
        var port = req.body.port;
        var https = (req.body.https === "true");
        this.getAgentService().createInstance(host, port, https)
            .then(function (agent) {
            return agent.setConfig(req.body.data);
        })
            .then(function (result) {
            res.send(result);
        }.bind(this))
            .catch(function (err) {
            this.logger.error("checkAgentByHostAndPort", err);
            next(err);
        }.bind(this));
    }
    getConfig(req, res, next) {
        var host = req.body.host;
        var port = req.body.port;
        var https = (req.body.https === "true");
        this.getAgentService().createInstance(host, port, https)
            .then(function (agent) {
            return agent.getConfig();
        })
            .then(function (result) {
            res.send(result);
        }.bind(this))
            .catch(function (err) {
            next(err);
        }.bind(this));
    }
    checkAgent(req, res, next) {
        var u = url.parse(req.url, true);
        var ip = tools.getIpClient(req);
        this.logger.debug({ path: u.pathname, ip: ip });
        var result = {
            status: 0,
            version: app.appVersion,
            startDate: this.startDate
        };
        res.send(result);
    }
    ;
}
exports.TagentsEndpoint = TagentsEndpoint;
//# sourceMappingURL=TagentsEndpoint.js.map