"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var TcrudServiceBase = turbine.TcrudServiceBase;
class TserviceCommand extends TcrudServiceBase {
    constructor(config) {
        super(config);
    }
    search(opt) {
        return super.search(opt);
    }
    save(obj, opt) {
        return super.save(obj, opt)
            .then((result) => {
            app.ClusterManager.getClient().publish("savePlugin", JSON.stringify(result));
            return result;
        });
    }
}
exports.TserviceCommand = TserviceCommand;
//# sourceMappingURL=TserviceCommand.js.map