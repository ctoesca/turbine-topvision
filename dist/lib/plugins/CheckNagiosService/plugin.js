
"use strict";

const CheckHttp = require('../CheckHttp/plugin.js');

module.exports = class CheckNagiosService extends CheckHttp {

	constructor( opt ){
		super( opt );
	}

	processFailure(args, result , e){
		return super.processFailure(args, result , e);
	}

	processSuccess(args, result, response, body){
			
		var parts = body.split("|");	

		if ((parts.length < 3)||isNaN(parts[0]))
		{		
			result.output = body;
			result.exitCode = 3;
		}else
		{
			result.exitCode = parseInt( parts[0] );
			result.output = parts[1];
			result.perfdata.data = parts[2];
		}
				
		return result;
	}

}











