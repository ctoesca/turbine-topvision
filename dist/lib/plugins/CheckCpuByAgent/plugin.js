"use strict";

const turbine = require("turbine")
const BasePlugin = require('../BasePlugin/plugin.js');
const StringTools = turbine.tools.StringTools;
const request = require('request');

module.exports = class CheckCpuByAgent extends BasePlugin {

	constructor( opt ){
		super( opt );
	}
	
    getAgent(host){
	    
		return app.getService("checker").agentsService.getByHost(host).then( function(agent){
		    if (agent == null)
		        throw "L'agent "+host+" n'existe pas"
		    else
		        return agent
		});
	}
	
	exec(args, success, error, service){
	    
	    this.getAgent(args.host)
        .then( (agent)=>
        {
            var opt = { 
    			strictSSL: false,
    			timeout: 10000,
    			time : true,
    			json: true
		    }
		    var url = agent.getUrl()+"/_plugin/checker/check/cpu"
		    this.req = request.get(
				url,
				opt,
				(e, response, body) => {
                    try
                    {
    					var result = {
    						output: "",
    						exitCode: 3
    					}
    
    				    if (e){
    				    	result.output = e.toString();
    				    }
    				    else{
    				    	result.output = body.output;
    				    	result.exitCode = body.currentState;
    				    	result.perfdata = body.data
    				    	response.resume();
    				    }
    
    					success(result);
    					
                    }catch(err){
                        error(err)
                    }
				    	
				})
		})
		.catch(function(err){
            error(err)
        })

	}
}















