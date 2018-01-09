
"use strict";

const BasePlugin = require('../BasePlugin/plugin.js');

module.exports = class CheckAgent extends BasePlugin {

	constructor( opt ){
		super( opt );
	}
	getAgent(args){
	    
		return app.getService("agentsService").getAgentForHost("127.0.0.1", 8090).then( function(agent){
		    if (agent == null)
		        throw "Aucun agent disponible n'accède à 127.0.0.1:8090"
		    else
		        return agent
		});
	}
	
	release(){
	    super.release()
	}
	exec(args, success, error){
	 
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
                url: "http://localhost:8090/docs/config/"
            }
            agent.http.request(opt).then( function(result){
                
                var end = new Date()    
                r.perfdata.ellapsed = end - startTime
                
                r.output = "HTTP "+result.status+" in "+result.headers["X-Time"]+" ms"
            
                if (result.status<400)
                    r.exitCode = 0;
                else
                    r.exitCode = 2;
                success(r)
            })
            .catch(function(err){
                error(err)
            })
        })
        .catch(function(err){
            error(err)
        })
        
        
        
		/*this.getAgent().get(
				    this.getUrl( args ),
				    opt,
				    function (e, response, body) {
                        try{

    				    	this.runningRequestsCount --;
    						this.totalRequestsCount ++; 
    						var now = new Date();
    
    						var result = {
    							output: "",
    							exitCode: 3,
    							lastCheck: now,
    							perfdata: {
    								ellapsed: now.getTime() - startTime.getTime()
    							}
    						}
    
    				    	if (e){
    				    		result = this.processFailure(args, result, e);								    	
    				    	}
    				    	else{
    				    		result.perfdata.ellapsed = response.elapsedTime;
    				    		result = this.processSuccess(args, result, response, body);
    				    		response.resume();
    				    	}
    
    						success(result);
                        }catch(err){
                            error(err)
                         
                        }
				    	
				    }.bind(this)
		);*/
		
	}


}











































































