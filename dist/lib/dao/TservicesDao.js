"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const turbine = require("turbine");
var TdaoMysql = turbine.dao.TdaoMysql;
const Promise = require("bluebird");
const moment = require("moment");
class TservicesDao extends TdaoMysql {
    constructor(objectClassName, datasource, config) {
        super(objectClassName, datasource, config);
        this.jsonFields = {
            "perfdata": true,
            "args": true
        };
        app.getDao("Command")
            .then((dao) => {
            this.daoCommands = dao;
        });
    }
    reset() {
        return this.queryTransaction("UPDATE services SET scheduled=0");
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
    getServicesToCheck(opt) {
        if (typeof opt.limit == "undefined")
            opt.limit = 10;
        return this.select({
            where: 'enabled>0 AND check_interval IS NOT NULL AND scheduled=0 AND (duration_sec >= check_interval OR duration_sec IS NULL)',
            orderBy: 'retard DESC, check_interval ASC',
            limit: opt.limit
        });
    }
    processObjects(objects, fields) {
        var commandsPromises = [];
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            commandsPromises.push(this.getCommand(obj));
        }
        return Promise.all(commandsPromises)
            .then((commands) => {
            for (var i = 0; i < objects.length; i++)
                objects[i].command = commands[i];
            return objects;
        });
    }
    getCommand(obj) {
        if (obj.id_command) {
            return this.daoCommands.getById(obj.id_command, {
                fields: "id,name,args"
            })
                .then((command) => {
                return command;
            });
        }
        else {
            return null;
        }
    }
    saveCheckResults(results) {
        var SQL = "";
        try {
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                SQL += "UPDATE services SET ";
                SQL += "scheduled=0";
                SQL += ",last_check='" + moment(result.checkTime).format("YYYY-MM-DD HH:mm:ss") + "'";
                if (result.previousCheckTime)
                    SQL += ",previous_check='" + moment(result.previousCheckTime).format("YYYY-MM-DD HH:mm:ss") + "'";
                if (typeof result.ellapsed == "number")
                    SQL += ",ellapsed='" + result.ellapsed + "'";
                else
                    SQL += ",ellapsed=NULL";
                if (result.perfdata)
                    SQL += ",perfdata=" + this.escapeSqlString(JSON.stringify(result.perfdata));
                if (typeof result.output != "undefined")
                    SQL += ",output=" + this.escapeSqlString(result.output);
                else
                    SQL += ",output=NULL";
                SQL += ",current_state=" + result.exitCode;
                SQL += " WHERE " + this.IDField + "=" + result.serviceId + ";";
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        if (SQL != "") {
            return this.queryTransaction(SQL);
        }
        else {
            return Promise.resolve(0);
        }
    }
    getUniqueParents(childrenIds) {
        if (childrenIds.length == 0) {
            return Promise.resolve([]);
        }
        else {
            var where = "id_service IN (" + childrenIds.join(',') + ")";
            return app.getDao("x_service_parents")
                .then(dao => {
                return dao.select({
                    where: where,
                    groupBy: 'id_parent'
                });
            })
                .then(children => {
                var ids = [];
                for (var i = 0; i < children.length; i++) {
                    ids.push(children[i].id_parent);
                }
                return this.getByIds(ids);
            });
        }
    }
    getParents(id) {
        return app.getDao("x_service_parents")
            .then(dao => {
            return dao.select({
                where: "id_service=" + id
            });
        })
            .then((results) => {
            var ids = [];
            for (var i = 0; i < results.length; i++) {
                ids.push(results[i].id_parent);
            }
            return this.getByIds(ids);
        });
    }
    setScheduled(idList, value) {
        if (idList.length > 0) {
            if (value)
                var valueStr = 1;
            else
                var valueStr = 0;
            var SQL = "UPDATE services SET scheduled=" + valueStr + " WHERE id IN (" + idList.join(",") + ")";
            return this.queryTransaction(SQL);
        }
        else {
            return new Promise((resolve, reject) => {
                resolve(0);
            });
        }
    }
}
exports.TservicesDao = TservicesDao;
//# sourceMappingURL=TservicesDao.js.map