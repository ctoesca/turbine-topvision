
"use strict";

const CheckHttpByAgent = require('../CheckHttpByAgent/plugin.js');

module.exports = class CheckElastic extends CheckHttpByAgent {

	constructor( opt ){
		super( opt );
	}
    getUrl(args){
        return args.url+"/_cluster/health?pretty=true"
    }
	processFailure(args , e){
		return super.processFailure(args , e);
	}
    getDefaultArgs(){
	    var r = super.getDefaultArgs()
	    r.showBody = false
	    r.showHttpStatus = false
	    return r
	}
	
    processSuccess(args, result, startTime)
	{
		var r = super.processSuccess(args, result, startTime)
	
		if (result.status < 400 )
		{
		    try{
    		    var data = JSON.parse(result.result)
    		   
        		    
            	if (data.status == "green"){
                    r.exitCode = 0;
            	}
                else if (data.status == "yellow"){
                    r.exitCode = 1;
                }
                else if (data.status == "red"){       
                    r.exitCode = 2;
                }
                
                r.output = "status: "+data.status
                
                if (data.unassigned_shards>0)
                    r.output += ", unassigned_shards="+data.unassigned_shards
                    
                
		    }catch(err){
		        
		        r.exitCode = 3;
		        r.output = err.toString()
		    }
		}

		return r;
	}

}


























