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
			perfdata : {
			    
			}
	    }
	    if (args.children){
	        var totalEllapsed = 0;
	        var count = 0
	        
	        for (var i=0; i< args.children.length; i++){
    	        var child = args.children[i]
    	        
    	       
    	        if ((child.current_state != 3) && child.perfdata && child.perfdata.ellapsed)
    	        {
    	           totalEllapsed += child.perfdata.ellapsed
    	           count ++
    	           r.output += " "+child.name+": "+child.perfdata.ellapsed+" ms\n"
    	        }
    	        else{
    	            r.exitCode = 3;
    	            r.output += " "+child.name+": ???\n"
    	        }
    	        //r.perfdata[child.name] = child.perfdata
    	    }
    	   
    	    if ((r.exitCode != 3)&&(count != 0))
    	    {
    	        var avgEllapsed = Math.round( totalEllapsed / count )
    	    
    	        r.output += "AVG="+avgEllapsed+" ms"
    	        
    	        r.perfdata.ellapsed = avgEllapsed
    	       
    	        
    	        if (avgEllapsed > 500)
            	    r.exitCode = 1
            	if (avgEllapsed > 1000)
            	    r.exitCode = 2   
    	    }
    	        
	    }else{
	        r.exitCode = 3;
	        r.output = "children "+args.children
	    }
	    success(r)
	    
	}  
	randomIntFromInterval(min,max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    }
}








































