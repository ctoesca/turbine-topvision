
"use strict";

const CheckHttp = require('../CheckHttp/plugin.js');
const request = require('request');

module.exports = class CheckTomcatRequests extends CheckHttp {

	constructor( opt ){
		super( opt );
		if (!this.id)
		    this.id = Math.round(Math.random()*1000000);
 
	}
    getUrl(args){
        var port = args.port || 8080
        
        return args.url+'/jolokia/read/Catalina:name="http-nio-'+port+'",type=GlobalRequestProcessor?includeStackTrace=false'
    }
    release(){
	   
	    super.release()
	}
	processFailure(args, result , e){
		return super.processFailure(args, result , e);
	}

	processSuccess(args, result, response, body){
		/*
		http://localhost:8090/jolokia/read/Catalina:name=%22http-nio-8090%22,type=GlobalRequestProcessor
		*/
		/*
    	{
            request: {
                mbean: "Catalina:name="http-nio-8090",type=GlobalRequestProcessor",
                type: "read"
            },
            value: {
                requestCount: 120,
                maxTime: 138,
                bytesReceived: 0,
                modelerType: "org.apache.coyote.RequestGroupInfo",
                bytesSent: 129405,
                processingTime: 614,
                errorCount: 35
            },
            timestamp: 1490450181,
            status: 200
        }
		*/
		
		result.output = body			
		try{
		    var data = JSON.parse(body);
		    
		    result.exitCode = 0;
		    
		    result.output = "errorCount="+data.value.errorCount+", requestCount="+data.value.requestCount+", bytesSent="+data.value.bytesSent
            result.perfdata.errorCount = data.value.errorCount
            result.perfdata.requestCount = data.value.requestCount
            result.perfdata.bytesSent = data.value.bytesSent
            
            this.initCounter(args)  
            
		}catch(err){
		    if (data && data.error) 
		        result.output = data.error
		    else
		        result.output = err.toString()+", body="+body
		    result.exitCode = 3;
		}
        
         
		return result;
	}
	callAgent(opt){
	    
	}
	initCounter(args){
	    //init couters
       
		
		var port = args.port || 8080
        var url = args.url+'/jolokia/exec/Catalina:name="http-nio-'+port+'",type=GlobalRequestProcessor/resetCounters'
	    var opt = { 
			strictSSL: false,
			timeout: 5000,
			url:url
		}
		
	    if (args.proxy)
	        opt.proxy = args.proxy;
	    
		this.req2 = request.get(
			opt,
			function (e, response, body) {
            
                if (e)
                    logger.error("CheckTomcatRequests init counter", e);
				else
				    logger.info(this.id+": CheckTomcatRequests init counter OK ");
	
			}.bind(this)
		)
	}

}





























































