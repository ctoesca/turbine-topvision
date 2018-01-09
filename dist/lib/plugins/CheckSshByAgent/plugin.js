"use strict";

const BasePlugin = require('../BasePlugin/plugin.js');
const StringTools = Turbine.tools.StringTools;

module.exports = class CheckSshByAgent extends BasePlugin {

	constructor( opt ){
		super( opt );
	}
	
    getAgent(args){
	    
		return app.getService("agentsService").getAgentForHost("cdxlan017", 3000).then( function(agent){
		    if (agent == null)
		        throw "L'gent cdxlan017:3000 n'existe pas"
		    else
		        return agent
		});
	}
	
	exec(args, success, error){
        var start = new Date()
        
        logger.debug("exec script=",args)
        
        	var startTime = new Date();
	
		var r = {
    		output: "",
    		exitCode: 3,
    		perfdata: {
    	    }
        } 
    				
        this.getAgent().then(function(agent)
        {
            var opt = {
                script: args.script,
                username: args.opt.username,
                password: args.opt.password,
                host: args.host
            }
			
            agent.ssh.exec(opt).then( function(result){
               				
                var duree = (new Date() - start)    
                var r = this.processResult( result.stdout, result.stderr, result.exitCode, args);
                success(r)
            }.bind(this))
            .catch(function(err){
                error(err)
            })
        }.bind(this))
        .catch(function(err){
            error(err)
        })
        
	}
    
   
	processResult( stdout, stderr, exitCode, args ){
	    
	    var r = {
	        output: stdout,
	        exitCode: exitCode,
	        perfdata: {
	            raw: ""
	        }
	    }
	    
	    if (exitCode > 0){
	        r.output += stderr
	    }else{
	        r.output = stdout.leftOf("|");
	        if (r.output.trim() == "")
	            r.output = stdout
	            
	        r.perfdata.raw = stdout.rightOf("|").replace(/\n/g, "").trim();
	     
	    }
	        
	    return r;
	}

}




