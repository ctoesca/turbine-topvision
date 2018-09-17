"use strict";

const CheckSshByAgent = require('../CheckSshByAgent/plugin.js');

module.exports = class CheckLoadBySsh extends CheckSshByAgent {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
	    //args.script = "cat /proc/loadavg";
	    args.script = "cat /proc/loadavg"; 
        super.exec(args, success, error)    
	}  
	
    processResult( stdout, stderr, exitCode, args ){
	    
	    var r = {
	        output: stdout,
	        exitCode: 3,
	        perfdata: {
	            raw: ""
	        }
	    }
	    
	    if (exitCode > 0){
	        r.output += stderr
	    }else{
	        var reg = /^([0-9]*\.[0-9]*)\s([0-9]*\.[0-9]*)\s([0-9]*\.[0-9]*)/g
	        var result = reg.exec(stdout.trim());
	        //exemple result = ["1.02 1.20 1.24","1.02","1.20","1.24"]
	        if (result && (result.length != 4))
	        {
	            r.output += "le contenu de /proc/loadavg n'a pas pu être traité (ne correspond pas au format attendu)"
	        }else{
	             r.output = result[1]+" "+result[2]+" "+result[3] +" (1m, 5m, 15m)";
	             r.perfdata.raw = "1m="+result[1]+";5m="+result[2]+";15m="+result[3];
	             r.exitCode = 0;
	        }
	    }
	        
	    return r;
	}
	
}






















