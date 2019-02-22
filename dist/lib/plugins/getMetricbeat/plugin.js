"use strict";

const request = require('request');
const BasePlugin = require('../BasePlugin/plugin.js');
const elasticsearch = require('elasticsearch');
const moment = require("moment");
 
module.exports = class getMetricbeat extends BasePlugin {
 
	constructor( opt ){
		super( opt );
		this.elasticClient = new elasticsearch.Client({
		  host: 'localhost:9500',
		  log: 'info'
		});
	}
	release(){
	    /*if (this.req)
	        this.req.abort();*/
	    super.release()
	}
	getDefaultArgs(){
	    return  {  
	    }
	}
	exec(args, success, error, service){
	    
	    var defaultArgs = this.getDefaultArgs()
	    
	    for (var k in defaultArgs){
	        if (!args[k])
	            args[k] = defaultArgs[k]
	    }
		
		var startTime = new Date();
        
        /*if (!args.url){
            error("Argument manquant: 'url'")
            return
        }*/
        
		var opt = {}
					
		if (args.username){
			opt.auth = {
		    	'user': args.username,
		    	'pass': args.password
		  	}		 
		}
        var q = args.q+" AND beat.hostname:"+args.hostname
        
        this.elasticClient.search({
          index: 'metricbeat-6.3.0-'+moment().format("YYYY.MM.DD"),
          q: q,
          sort: "@timestamp:desc",
          size: 1
        }).then( body => {

            var r = this.getResult(body)
            r.perfdata.q = q
            success(r)
        })
        .catch( err => {
            error(err)
        })

	}
    
    getResult(body, success, error){
        error("getResult is not implemented")
    }
}














