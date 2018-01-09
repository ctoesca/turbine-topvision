"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TcrudServiceBase_1 = require("../../../TcrudServiceBase");
class TserviceCommand extends TcrudServiceBase_1.TcrudServiceBase {
    constructor(config) {
        super(config);
    }
    search(opt) {
        return super.search(opt);
    }
    save(obj, opt) {
        return super.save(obj, opt)
            .then(function (result) {
            app.ClusterManager.getClient().publish("savePlugin", JSON.stringify(result));
            return result;
        }.bind(this));
    }
}
exports.TserviceCommand = TserviceCommand;
//# sourceMappingURL=TserviceCommand.js.map