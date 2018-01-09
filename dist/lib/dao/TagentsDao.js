"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TdaoMysql_1 = require("../../../dao/TdaoMysql");
class TagentsDao extends TdaoMysql_1.TdaoMysql {
    constructor(objectClassName, datasource, config) {
        super(objectClassName, datasource, config);
    }
    getByHostAndPort(host, port, status) {
        var sql = "host like '" + host + "' AND port like '" + port + "'";
        if (arguments.length > 2)
            sql += " AND status=" + status;
        return this.select({
            where: sql
        }).then(function (result) {
            if (result.length > 0)
                return result[0];
            else
                return null;
        });
    }
}
exports.TagentsDao = TagentsDao;
//# sourceMappingURL=TagentsDao.js.map