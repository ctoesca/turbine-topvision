"use strict";

const CheckSshByAgent = require('../CheckSshByAgent/plugin.js');

module.exports = class CheckLoadBySsh extends CheckSshByAgent {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
	    args.script = "/supervision/libexec/check_load -w 5,5,5 -c 15,15,15"; 
        super.exec(args, success, error)    
	}  
	

}





































