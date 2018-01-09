"use strict";

const CheckBySsh = require('../CheckBySsh/plugin.js');

module.exports = class CheckMemoryBySsh extends CheckBySsh {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
        super.exec(args, success, error) 
	}

}




