"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var TdaoMysql = turbine.dao.TdaoMysql;
class TcommandsDao extends TdaoMysql {
    constructor(objectClassName, datasource, config) {
        super(objectClassName, datasource, config);
        this.jsonFields = {
            "args": true
        };
    }
    processObjects(objects, fields) {
        return objects;
    }
    getByName(name) {
        return this.select({
            where: "name like '" + name + "'"
        }).then(function (result) {
            if (result.length > 0)
                return result[0];
            else
                return null;
        });
    }
}
exports.TcommandsDao = TcommandsDao;
//# sourceMappingURL=TcommandsDao.js.map