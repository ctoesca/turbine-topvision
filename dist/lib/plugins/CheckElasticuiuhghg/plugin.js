
"use strict";

const CheckHttp = require('../CheckHttp/plugin.js');

module.exports = class CheckElasticuiuhghg extends CheckHttp {

	constructor( opt ){
		super( opt );
	}
    getUrl(args){
        return args.url+"/_cluster/health?pretty=true" 
    }
	processFailure(args, result , e){
		return super.processFailure(args, result , e);
	}

	processSuccess(args, result, response, body){
		
		try{
		    result.exitCode = 3;
		    var data = JSON.parse(body);
		    
		    result.output = data.status		

		    if (data.status == "green")
		        result.exitCode = 0;
            else if (data.status == "yellow")		        
                result.exitCode = 1;
            else if (data.status == "red")	        
                result.exitCode = 2;
            
		}catch(err){
		    result.output = err
		}

		return result;
	}

}

































