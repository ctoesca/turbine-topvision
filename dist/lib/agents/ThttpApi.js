"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TeventDispatcher_1 = require("../../../events/TeventDispatcher");
const tools = require("../../../tools");
const Promise = require("bluebird");
const fs = require("fs");
const request = require("request");
class ThttpApi extends TeventDispatcher_1.TeventDispatcher {
    constructor(agent, config) {
        super();
        this.agent = agent;
    }
    request(opt) {
        var params = {};
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("POST", "/api/http/request", params);
    }
    download(remotePath, localPath, opt) {
        return new Promise(function (resolve, reject) {
            var params = {
                "path": remotePath
            };
            if (opt)
                params = tools.array_replace_recursive(params, opt);
            var url = this.agent.getUrl() + "/api/filesystem/download?path=" + remotePath;
            var stream = fs.createWriteStream(localPath);
            opt = {
                url: url,
                timeout: 300000
            };
            var req = request(opt, function (err, response, body) {
                if (err) {
                    this.agent.logger.error("Tagent.download url=" + url + " : ", err);
                    resolve({ result: null, error: err.toString(), status: null });
                }
                else {
                    resolve({ result: localPath, status: response.statusCode, headers: response.headers });
                }
            }.bind(this));
        }.bind(this));
    }
    upload(localPath, remotePath, opt) {
        var params = {
            "path": remotePath,
            "overwrite": true
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        var url = this.agent.getUrl() + "/api/filesystem/upload";
        var httpOptions = {};
        return HttpClient.httpUpload(url, localPath, params, httpOptions);
    }
}
exports.ThttpApi = ThttpApi;
//# sourceMappingURL=ThttpApi.js.map