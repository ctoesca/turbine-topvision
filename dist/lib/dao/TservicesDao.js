"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TdaoMysql_1 = require("../../../dao/TdaoMysql");
const moment = require("moment");
class TservicesDao extends TdaoMysql_1.TdaoMysql {
    constructor(objectClassName, datasource, config) {
        super(objectClassName, datasource, config);
        this.daoCommands = app.getDao("Command");
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
            if (typeof obj.perfdata == "string") {
                try {
                    obj.perfdata = JSON.parse(obj.perfdata);
                }
                catch (err) {
                    this.logger.error("Echec parse service.perfdata  (ID=" + obj.id + ") '" + obj.perfdata + "' : " + err);
                }
            }
            if (typeof obj.args == "string") {
                try {
                    obj.args = JSON.parse(obj.args);
                }
                catch (err) {
                    this.logger.error("Echec parse service.args (ID=" + obj.id + ") '" + obj.args + "' : " + err);
                }
            }
            commandsPromises.push(this.setCommand(obj));
        }
        return Promise.all(commandsPromises);
    }
    setCommand(service) {
        if (service.id_command) {
            return this.daoCommands.getById(service.id_command).then(function (command) {
                service.command = command;
                return service;
            });
        }
        else {
            return service;
        }
    }
    saveServices(services) {
        try {
            var SQL = "";
            for (var i = 0; i < services.length; i++) {
                var service = services[i];
                SQL += "UPDATE services SET ";
                SQL += "scheduled=0";
                SQL += ",last_check='" + moment(service.last_check).format("YYYY-MM-DD HH:mm:ss") + "'";
                if (service.previous_check)
                    SQL += ",previous_check='" + moment(service.previous_check).format("YYYY-MM-DD HH:mm:ss") + "'";
                SQL += ",ellapsed='" + service.ellapsed + "'";
                if (service.perfdata)
                    SQL += ",perfdata='" + JSON.stringify(service.perfdata) + "'";
                if (typeof service.output != "undefined")
                    SQL += ",output=" + this.escapeSqlString(service.output);
                else
                    SQL += ",output=NULL";
                SQL += ",current_state=" + service.current_state;
                SQL += " WHERE " + this.IDField + "=" + service.id + ";";
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
            return new Promise(function (resolve, reject) {
                resolve(0);
            }.bind(this));
        }
    }
}
exports.TservicesDao = TservicesDao;
//# sourceMappingURL=TservicesDao.js.map