"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TeventDispatcher_1 = require("../../../events/TeventDispatcher");
const Tevent_1 = require("../../../events/Tevent");
const TfsApi_1 = require("./TfsApi");
const ThttpApi_1 = require("./ThttpApi");
const TsshApi_1 = require("./TsshApi");
const TagentEvent_1 = require("./TagentEvent");
const tools = require("../../../tools");
const TcrudServiceBase_1 = require("../../../TcrudServiceBase");
const Promise = require("bluebird");
const request = require("request");
class Tagent extends TeventDispatcher_1.TeventDispatcher {
    constructor(data) {
        super();
        this.httpConnectTimeout = 5000;
        this.httpTimeout = 300000;
        this.data = data;
        this.fs = new TfsApi_1.TfsApi(this, {});
        this.http = new ThttpApi_1.ThttpApi(this, {});
        this.ssh = new TsshApi_1.TsshApi(this, {});
        this.dataService = new TcrudServiceBase_1.TcrudServiceBase({
            model: {
                "name": "Agent",
                IDField: "id",
                "dao": {
                    "daoConfig": {
                        datasource: "topvision",
                        tableName: "agents",
                        viewName: "agents"
                    }
                },
                "entryPoint": "agents"
            }
        });
        this.logger = app.getLogger(this.constructor.name);
    }
    destroy() {
        super.free();
    }
    get name() {
        return this.data.host + ":" + this.data.port;
    }
    set host(v) {
        this.data.host = v;
    }
    get host() {
        return this.data.host;
    }
    save() {
        return this.dataService.save(this.data);
    }
    getUrl() {
        var r = "https://" + this.data.host + ":" + this.data.port;
        if (!this.data.https)
            r = "http://" + this.data.host + ":" + this.data.port;
        return r;
    }
    stop(opt) {
        var params = {};
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        var r = this._call("GET", "/api/admin/stop", params);
        return r;
    }
    setConfig(data, options = null) {
        var params = {
            "data": data,
            "opt": {}
        };
        if (options)
            params.opt = tools.array_replace_recursive(params.opt, options);
        var r = this._call("POST", "/api/setConfig", params);
        return r;
    }
    getConfig(options = null) {
        var params = {};
        if (options)
            params = tools.array_replace_recursive(params, options);
        var r = this._call("POST", "/api/getConfig", params);
        return r;
    }
    checkPort(host, port, opt) {
        var params = {
            "host": host,
            "port": port
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        var r = this._call("GET", "/api/checkPort", params);
        return r;
    }
    check() {
        var params = {};
        return this._call("GET", "/api/checkAgent", params, {
            "connect_timeout": 3000,
            "timeout": 5000,
            "retryOnOtherAgents": false
        });
    }
    _call(method, url, data, httpOptions = null) {
        return new Promise(function (resolve, reject) {
            var _httpOptions = {
                "retryOnOtherAgents": true,
                "connect_timeout": this.httpConnectTimeout,
                "timeout": this.httpTimeout
            };
            if (httpOptions)
                _httpOptions = tools.array_replace_recursive(_httpOptions, httpOptions);
            var opt = {
                method: method,
                url: this.getUrl() + url,
                strictSSL: false,
                timeout: this.httpTimeout,
                json: true,
                headers: {
                    'User-Agent': 'topvision'
                }
            };
            if (typeof data == "object") {
                if (method == "GET") {
                    opt.url += "?";
                    var params = [];
                    for (var k in data)
                        params.push(k + "=" + data[k]);
                    opt.url += params.join("&");
                }
                else {
                    opt.body = data;
                }
            }
            else {
                if ((method == "POST") || (method == "PUT")) {
                    opt.body = data;
                }
            }
            var req = request(opt, function (err, response, body) {
                if (err) {
                    this.logger.debug("Tagent._call url=" + opt.url + " : " + err.toString());
                    err = new Error("Echec appel de l'agent " + this.name + ": " + err.toString());
                    req.abort();
                    var evt = new Tevent_1.Tevent(TagentEvent_1.TagentEvent.FAILURE, err);
                    this.dispatchEvent(evt);
                    if (evt.data.retryWith && _httpOptions.retryOnOtherAgents) {
                        this.logger.debug("!!! RETRY WITH AGENT ", evt.data.retryWith.name);
                        evt.data.retryWith._call(method, url, data, httpOptions).then(function (result) {
                            resolve(result);
                        }, function (err) {
                            reject(err);
                        });
                    }
                    else {
                        reject(err);
                    }
                }
                else {
                    if (response.statusCode == 200) {
                        resolve(body);
                    }
                    else {
                        if (typeof body == "string")
                            err = new Error("Echec appel de l'agent " + this.name + ": statusCode=" + response.statusCode + ", body=" + body);
                        else
                            err = new Error("Echec appel de l'agent " + this.name + ": statusCode=" + response.statusCode + ", body=" + JSON.stringify(body));
                        evt = new Tevent_1.Tevent(TagentEvent_1.TagentEvent.FAILURE, err);
                        this.dispatchEvent(evt);
                        reject(err);
                    }
                }
            }.bind(this));
        }.bind(this));
    }
}
exports.Tagent = Tagent;
//# sourceMappingURL=Tagent.js.map