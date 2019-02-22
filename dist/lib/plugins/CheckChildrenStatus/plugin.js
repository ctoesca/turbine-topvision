"use strict";

const BasePlugin = require('../BasePlugin/plugin.js');

module.exports = class CheckLoadBySsh extends BasePlugin {

	constructor( opt ){
		super( opt );
		this.exitCodesPriorities = [0,2,3,1]
	}
	
    isPriorityGreater(exitCode1, exitCode2){
        return this.exitCodesPriorities[exitCode1] > this.exitCodesPriorities[exitCode2]
    }
    
	exec(args, success, error){
	    var r = {
	        output: "ok",
			exitCode: 0,
			perfdata : null
	    }
	    if (args.children){
	        
	        for (var i=0; i< args.children.length; i++)
	        {
    	        var child = args.children[i]
    	        if (this.isPriorityGreater(child.exitCode, r.exitCode)
    	        {
    	           r.exitCode = child.exitCode
    	           r.output += " "+child.name+": "+child.output+"\n"
    	        }
    	    }

	    }else{
	        r.exitCode = 3;
	        r.output = "no children sservices"
	    }
	    success(r)
	    
	}  
	randomIntFromInterval(min,max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    }
}









































