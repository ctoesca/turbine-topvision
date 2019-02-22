"use strict";

const request = require('request');
const getMetricbeat = require('../getMetricbeat/plugin.js');
const elasticsearch = require('elasticsearch');
const moment = require("moment"); 

module.exports = class getMetricbeatCpu extends getMetricbeat {
 
	constructor( opt ){
		super( opt );
	}
	
    getResult(body){
        
         var r = {
            exitCode: 3,
            output: "???",
            perfdata: {
            }
        }
        if (body.hits && body.hits.hits && body.hits.hits.length == 1){
                var _source = body.hits.hits[0]._source
                var system = _source.system
                /*
                "system": {
                    "memory": {
                      "total": 6440804352,
                      "used": {
                        "bytes": 5888602112,
                        "pct": 0.9143
                      },
                      "free": 552202240,
                  */
                var usedPct = Math.round( 10*system.memory.used.pct * 100)/10
                var availableGo = Math.round( 10*system.memory.free/1024/1024/1024 )/10
                var totalGo = Math.round( 10*system.memory.total/1024/1024/1024 )/10
                
                r.exitCode = 0
                r.output = "Memory used: "+usedPct+"% (available: "+availableGo+"Go / "+totalGo+"Go)"
                r.perfdata.usedPct = usedPct
                r.perfdata.availableGo = availableGo
                r.perfdata.totalGo = totalGo
               
        }else{
            r.exitCode = 3
            r.output = "No Data"
        }
            
        return r
    }

}



















