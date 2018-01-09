
"use strict";

const ShellExec = require('../ShellExec/plugin.js');

module.exports = class SLEEP extends ShellExec {

	constructor( opt ){
		super( opt );
	}
   
	exec(args, success , error){
    	error("erreur")
	}

}
