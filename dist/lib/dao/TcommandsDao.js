"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TdaoMysql_1 = require("../../../dao/TdaoMysql");
class TcommandsDao extends TdaoMysql_1.TdaoMysql {
    constructor(objectClassName, datasource, config) {
        super(objectClassName, datasource, config);
    }
    processObjects(objects, fields) {
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (typeof obj.args == "string") {
                try {
                    obj.args = JSON.parse(obj.args);
                }
                catch (err) {
                    this.logger.error("obj.args = " + obj.args + ", " + err.toString());
                }
            }
        }
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