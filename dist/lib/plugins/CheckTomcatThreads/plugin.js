
"use strict";

const CheckHttp = require('../CheckHttp/plugin.js');

module.exports = class CheckElastic extends CheckHttp {

	constructor( opt ){
		super( opt );
	} 
    getUrl(args){
        var port = args.port || 8080
        
        return args.url+'/jolokia/read/Catalina:name="http-nio-'+port+'",type=ThreadPool/currentThreadsBusy,maxThreads,currentThreadCount,connectionCount?ignoreErrors=true'
    }
	processFailure(args, result , e){
		return super.processFailure(args, result , e);
	}

	processSuccess(args, result, response, body){
		/*
		http://localhost:8090/jolokia/read/Catalina:name=%22http-nio-8090%22,type=ThreadPool/currentThreadsBusy,maxThreads,currentThreadCount,connectionCount?ignoreErrors=true
		
		*/
		/*
		{
        request: {
            mbean: "Catalina:name="http-nio-8090",type=ThreadPool",
            attribute: [
                "currentThreadsBusy",
                "maxThreads",
                "currentThreadCount",
                "connectionCount"
            ],
            type: "read"
        },
        value: {
            currentThreadsBusy: 1,
            connectionCount: 2,
            currentThreadCount: 10,
            maxThreads: 200
        },
        timestamp: 1490443293,
        status: 200
        }
		*/
		result.output = body			
		try{
		    var data = JSON.parse(body);
		    
		    result.exitCode = 0;
		    
		    result.output = "connectionCount="+data.value.connectionCount+", currentThreadsBusy="+data.value.currentThreadsBusy+" (maxThreads="+data.value.maxThreads+")"
            
		}catch(err){
		    result.exitCode = 3;
		}

		return result;
	}

}






















