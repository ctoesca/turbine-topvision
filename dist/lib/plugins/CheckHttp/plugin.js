"use strict";

const request = require('request');
const BasePlugin = require('../BasePlugin/plugin.js');

module.exports = class CheckHttp extends BasePlugin {

	constructor( opt ){
		super( opt );
		this.runningRequestsCount = 0;
		this.totalRequestsCount = 0;
		
	}
	getUrl(args){
		return args.url
	}
	release(){
	    if (this.req)
	        this.req.abort();
	    super.release()
	}
	exec(args, success, error, service){
	    
		if (typeof args.showBody == "undefined")
			args.showBody = false;
		if (typeof args.showHttpStatus == "undefined")
			args.showHttpStatus = true;
        if (typeof args.timeout == "undefined")
			args.timeout = 45000;
		
		var startTime = new Date();
		this.runningRequestsCount ++;
		
		var opt = { 
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

		this.req = request.get(
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
		);
		this.req.setMaxListeners(0);
	}

	processFailure(args, result , e){
		result.exitCode = 2;
		result.output = args.timeout+" "+args.url+": "+e.toString();	
		return result;
	}

	processSuccess(args, result, response, body){

		result.exitCode = 0;
						
		if (response.statusCode >= 400 ) {
			result.exitCode = 2;
			result.output = body
		}else{
	    
	        result.output = "";
		    if (args.showHttpStatus)	
		    	result.output = "HTTP "+response.statusCode+" in "+result.perfdata.ellapsed+" ms. ";

		    if (args.showBody){
			    result.output += body;
		    }
		}

		return result;
	}
	

}








































