"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var tools = turbine.tools;
var TeventDispatcher = turbine.events.TeventDispatcher;
const Promise = require("bluebird");
const fs = require("fs");
const request = require("request");
class TfsApi extends TeventDispatcher {
    constructor(agent, config) {
        super();
        this.agent = agent;
    }
    list(path, opt) {
        var params = {
            "path": path
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("GET", "/api/filesystem/list", params);
    }
    fileinfo(path, opt) {
        var params = {
            "path": path
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("GET", "/api/filesystem/filedinfo", params);
    }
    deleteFiles(path, opt) {
        var params = {
            "path": path
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("POST", "/api/filesystem/deleteFiles", params);
    }
    moveFile(path, dest, opt) {
        var params = {
            "path": path,
            "dest": dest
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("GET", "/api/filesystem/moveFile", params);
    }
    download(remotePath, localPath, opt) {
        return new Promise((resolve, reject) => {
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
            var req = request(opt, (err, response, body) => {
                if (err) {
                    this.agent.logger.error("Tagent.download url=" + url + " : ", err);
                    resolve({ result: null, error: err.toString(), status: null });
                }
                else {
                    resolve({ result: localPath, status: response.statusCode, headers: response.headers });
                }
            });
        });
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
    execScript(script, opt) {
        var params = {
            "script": script
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("POST", "/api/filesystem/execScript", params).then((result) => {
            result.stdout = result.stdout.replace(/\r\n/g, "\n");
            result.stderr = result.stderr.replace(/\r\n/g, "\n");
            return result;
        });
    }
    writeTextFile(path, content, opt) {
        var params = {
            "path": path,
            "content": content
        };
        if (opt)
            params = tools.array_replace_recursive(params, opt);
        return this.agent._call("POST", "/api/filesystem/writeTextFile", params);
    }
}
exports.TfsApi = TfsApi;
//# sourceMappingURL=TfsApi.js.map