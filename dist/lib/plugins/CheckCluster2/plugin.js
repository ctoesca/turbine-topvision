"use strict";

const BasePlugin = require('../BasePlugin/plugin.js');

module.exports = class CheckLoadBySsh extends BasePlugin {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
	    var r = {
	        output: "ok",
			exitCode: 0
	    }
	    if (args.children){
	        for (var i=0; i< args.children.length; i++){
    	        var child = args.children[i]
    	        r.output += " "+child.name+" "+child.last_check+"\n"
    	    }
	    }else{
	        r.exitCode = 3;
	        r.output = "children "+args.children
	    }
	    success(r)
	    
	}  
	
}




























