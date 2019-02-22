"use strict";
const turbine = require("turbine")

const TeventDispatcher = turbine.events.TeventDispatcher;
const Promise = require("bluebird");


module.exports = class BasePlugin extends TeventDispatcher {

	constructor( opt ){
		super( opt );
		this.opt = opt;
		this.running = false;
		this.timeout = null;
		this.logger = app.getLogger(this.constructor.name);
		this.logger.debug( this.constructor.name+" created: opt=", this.opt);
		Promise.config({
			cancellation: true
		});
	}

	exec(args, onCompleted){
		throw new Error("BasePlugin ne peut pas être exécuté")
	}

	free(){
		super.free()
		logger.info("Plugin '"+this.constructor.name+"' destroyed")
	}
	
	release(){
		this.running = false;
	}

	_exec(args, service)
	{
		if (this.running)
			throw "plugin is already running";

		this.running = true;
	    return new Promise((success, error) => {

	        var start = new Date()
	        this.exec(args, success, error, service)      
	    })
	    	  
	}
}



