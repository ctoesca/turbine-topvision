"use strict";

const request = require('request');
const BasePlugin = require('../BasePlugin/plugin.js');
const elasticsearch = require('elasticsearch');
const moment = require("moment");

module.exports = class CheckHttpByAgent extends BasePlugin {

	constructor( opt ){
		super( opt );
		this.elasticClient = new elasticsearch.Client({
		  host: 'localhost:9200',
		  log: 'info'
		});
	}
	
	getAgent(args){
	    return null;
		return app.getService("agentsService").getAgentForHost("127.0.0.1", 8090).then( function(agent){
		    if (agent == null)
		        throw "Aucun agent disponible n'accède à 127.0.0.1:8090"
		    else
		        return agent
		});
	}
	
	getUrl(args){
		return args.url
	}
	release(){
	    /*if (this.req)
	        this.req.abort();*/
	    super.release()
	}
	getDefaultArgs(){
	    return  {
	        url: null,
	        showBody: false,
	        showHttpStatus: true,
	        timeout: 45000
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
        
		var opt = { 
		    url: this.getUrl( args ),
			strictSSL: false,
			timeout: args.timeout,
			time : true
		}
		
        if (typeof args.proxy != "undefined")
			opt.proxy = args.proxy;
			
		if (args.username){
			opt.auth = {
		    	'user': args.username,
		    	'pass': args.password
		  	}		 
		}

		this.getAgent().then(function(agent)
        {
            agent.http.request(opt).then( function(result)
            {
                var r =  this.processSuccess(args, result, startTime)
                r.perfdata.agent = agent.data.host+":"+agent.data.port
                //this.savePerfdata(r, service)
                success( r)
            }.bind(this))
            .catch(function(err){
                var r =  this.processFailure(args, err, startTime)
                r.perfdata.agent = agent.data.host+":"+agent.data.port
                success( r )
            }.bind(this))
        }.bind(this))
        .catch(function(err){
            error(err.toString())
        })
	}
    savePerfdata( result, service){
     
        var id = new Date().getTime();
        var data = {
            "name": service.name,
            "@timestamp": id,
            "value": result.perfdata.ellapsed
        }
     
        this.elasticClient.create({
          index: 'topvision-'+moment().format("YYYY.MM.DD"),
          type: 'data',
          id: id,
          body: data
        }, function (error, response) {
          if (error){
              logger.error(error)
          }else{
              logger.info(response)
          }
        });
    }
	processFailure(args, e, startTime){
		
		var r = {
		    exitCode: 3,
		    output: args.url+": "+e,
		    perfdata: {
                ellapsed: new Date() - startTime
            }
		}
	
		return r;
	}

	processSuccess(args, response, startTime)
	{
	   
	    /* Format de 'response': 
	    {
	        isError: true/false,
	        error: object/string
		    status: xxx,
			result: "...body...",
			headers: { }
	   }*/
	 	
        var r = {
            output: "",
            exitCode: 3,
            perfdata: {
                ellapsed: new Date() - startTime
            }
        }
        
        if (response.isError)
        {
            if (typeof response.error == "object")
    		{
    		    // response.error est un objet 
    		 
    		       
    			if (typeof response.error.code != "undefined")
    			{
    			  
    			    var code = response.error.code
        			if (code == "ECONNREFUSED")
        			{
        				r.output = "Connexion refused"
        				r.exitCode = 2
        			}else if (code == "ENOTFOUND")
        			{
        			    r.output = "Le host n'existe pas (il n'a pas été trouvé dans le DNS)"
        			}else{
        			    if (response.error.message)
    					    r.output = response.error.message 
    					else
    					    r.output = "Error code="+code
        			}    
    			}
    			else
    			{
    				if (response.error.message)
    					r.output = response.error.message 
    				else
    				    r.output = JSON.stringify(response.error)
    			}
    		}else{
    		    // response.error n'est pas un objet 
    		    r.output = response.error
    		}
        }else{
            
            if (args.showHttpStatus){
                
			    r.output = "HTTP "+response.status +" in "+response.xTime+" ms"
            }
			
		    if (args.showBody)
			    r.output += "\n"+response.result
			    
    		if (response.status >= 400 )
    		{
    			r.exitCode = 2;
    		}else
    		{
    	        r.exitCode = 0;
    		}
    		
        }
       
		return r;
	}
	

}






































































































