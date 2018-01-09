"use strict";

const TeventDispatcher = require("../../../../events/TeventDispatcher").TeventDispatcher;

module.exports = class BasePlugin extends TeventDispatcher {

	constructor( opt ){
		super( opt );
		this.opt = opt;
	
		this.running = false;
		this.timeout = null;
		this.logger = app.getLogger(this.constructor.name);
		this.logger.debug( this.constructor.name+" created: opt=", this.opt);
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
		clearTimeout(this.timeout);
	}

	_exec(args, timeout, service)
	{
		if (this.running)
			throw "plugin is already running";

		this.running = true;
	    return new Promise(function(success, error) {

	         var start = new Date()
	         this.exec(args, success, error, service)
	         
	         this.timeout = setTimeout( function(){
	            var diff = Math.round( (new Date().getTime() - start.getTime() )/1000 )
	            error("TIMEOUT after "+diff +" sec")
	         }.bind(this), timeout*1000)

	    }.bind(this))
	}
}



