
"use strict";


const BasePlugin = require('../BasePlugin/plugin.js');
const portscanner = require('portscanner')
const net = require('net');
module.exports = class CheckPort extends BasePlugin {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
	     
	    var timeout = 2000;
        var s = new net.Socket();
        var start = new Date()
        s.setTimeout(timeout, function() { 
            s.destroy(); 
            success({
                output: "timeout after "+this.getEllapsed(start)+" ms",
                exitCode: 2
            })
        }.bind(this));
        
        s.connect(args.port, args.host, function() {
          
            s.destroy(); 
            success({
                output: "Port "+args.host+":"+args.port+" OK in "+this.getEllapsed(start),
                exitCode: 0
            })
            // we don't destroy the socket cos we want to listen to data event
            // the socket will self-destruct in 2 secs cos of the timeout we set, so no worries
        }.bind(this));
        
        // if any data is written to the client on connection, show it
       /* s.on('data', function(data) {
            console.log(port +': '+ data);
            s.destroy();
        });*/
        
        s.on('error', function(err) {
            // silently catch all errors - assume the port is closed
            s.destroy();
            success({
                    output: err.toString()+" in "+this.getEllapsed(start),
                    exitCode: 2
            })
        }.bind(this));
        
        
	}
    getEllapsed( start ){
        return Math.round(new Date() - start )+" ms";
    }
	

}














































































































