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
            
                var cpu = system.cpu.total.pct * 100 
                var cores = system.cpu.cores
                var used = Math.round( 10*(cpu/cores) )/10;
                
                r.exitCode = 0
                r.output = "CPU used: "+used+"%"
                r.perfdata.used = used
                       
        }else{
            r.exitCode = 3
            r.output = "No Data"
        }

        return r
    }
}














