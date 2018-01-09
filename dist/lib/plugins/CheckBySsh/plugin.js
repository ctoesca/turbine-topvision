"use strict";

const BasePlugin = require('../BasePlugin/plugin.js');
var SshConnection = require('ssh2');

module.exports = class CheckBySsh extends BasePlugin {

	constructor( opt ){
		super( opt );
	}
	
    getAgent(args){
	    
		return app.getService("agentsService").getAgentByHostAndPort("cdxlan017", 3000).then( function(agent){
		    if (agent == null)
		        throw "L'gent cdxlan017:3000 n'existe pas"
		    else
		        return agent
		});
	}
	
	exec(args, success, error){
        var start = new Date()
        
        logger.debug("exec script="+args.script)
        
	    this.execSshCommand( args.script, args.host, args.opt)
	    .then( function(result){
	       var duree = (new Date() - start)    
	       var r = this.processResult( result.stdout, result.stderr, result.exitCode, args);
	       success(r)
	    }.bind(this))
	    .catch( function(err){
	        error(err)
	    })
	       
	}
    
    execSshCommand(script, host, opt ){
        
        var defaultOpt = {
            port: 22, //22,
            username: null,//global.config.defaultSshUsername,
            password: null,//global.config.defaultSshPassword,
            pty: false,
            logError: true
        }
            
        if (typeof opt == "undefined"){
            var opt = defaultOpt;
        }else{
            
            for (var k in defaultOpt)
            {
                if (typeof opt[k] == "undefined")
                    opt[k] = defaultOpt[k]
            }
            
        }
        
        
        return new Promise(function(resolve, reject) {
			
			var r = {
				host: host,
				stdout: "",
				stderr: "",
				exitCode: null
			};		
			
			var promiseFinished = false;
			
			var conn = new SshConnection();
		
			conn.on('error', function(err){
		
				if (opt.logError){
			  		this.logger.debug({err:err.toString()}, "execSshCommand" );
				}
			  	
			  	if (!promiseFinished)
			  	    reject( err.level + " "+err.toString());
			  	    
			  	promiseFinished = true;

			}.bind(this));

			conn.on('end', function() {	
			  	if (!promiseFinished)
			  		resolve(r);	
			  		
			  	promiseFinished = true;
			}.bind(this));


			conn.on('ready', function()
			{
			   
				if (opt.pty)
					conn.exec(script, {pty:true}, onExec.bind(this));
				else
					conn.exec(script, onExec.bind(this));
			}.bind(this));


			function onExec(err, stream) {
			  
			  if (err){
			    reject(err);
			    promiseFinished = true;
			    return;
			  }

			  stream.on('exit', function(code, signal) {
			    r.exitCode = code;	
			  }.bind(this));

			  stream.on('close', function() {
			    conn.end();
			  }.bind(this));

			  stream.on('data', function(data) {	
			  	r.stdout += data;
			  }.bind(this));

			  stream.stderr.on('data', function(data) {
			   	r.stderr += data;
			  }.bind(this));
			}

			conn.connect({
			  host: host,
			  port: opt.port,
			  username: opt.username,
			  password: opt.password,
			  keepaliveCountMax : 10
			});		

		}.bind(this))
		

    }
		
	processResult( stdout, stderr, exitCode, args ){
	    
	    var r = {
	        output: stdout,
	        exitCode: exitCode
	    }
	    if (exitCode > 0)
	        r.output += stderr
	    
	    return r;
	}
	

}











































