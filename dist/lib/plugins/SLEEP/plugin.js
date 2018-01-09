
"use strict";


const BasePlugin = require('../BasePlugin/plugin.js');

module.exports = class Sleep extends BasePlugin {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
        var start = new Date()
	    setTimeout( function(){
	       var duree = (new Date() - start)/1000
	       success({
	            output: "attente terminée avc succes. duree="+duree+" sec",
	            exitCode: 0
	       })
	    }, args.duree)

	}

	

}
































































































