"use strict";

const request = require('request');
const CheckHttp = require('../CheckHttp/plugin.js');

module.exports = class CheckByAgent extends CheckHttp {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error, service){
	    super.exec(args, success, error, service);
	}

	processFailure(args, result , e){
		result.exitCode = 2;
		result.output = args.url+": "+e.toString();	
		return result;
	} 

	processSuccess(args, result, response, body){

		result.exitCode = 0;
						
		if (response.statusCode >= 400 ) {
			result.exitCode = 3;
			result.output = body
		}else{
	        body = JSON.parse(body)
	        result.exitCode = body.currentState;
	        result.output = body.output;
		}

		return result;
	}
	

}















































