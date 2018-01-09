"use strict";

const child_process = require('child_process');
const BasePlugin = require('../BasePlugin/plugin.js');
const utf8 = require('utf8');
module.exports = class ShellExec extends BasePlugin {
 
    
	constructor( opt ){
		super( opt );
	}

 	replaceEnvVars(v){
		for (var k in process.env){
			var varName = k;
			var value = process.env[k];
			v = v.replace("%"+varName+"%", value);
		}
		return v;
	}  
    free(){
        super.free()
    }
    
    release(){
        super.release()
        
        if (this.child){
            this.child.kill();
            this.child = null;
        }
    }
    
	exec(args, success, error){ 
    
		var startTime = new Date();
		
		if (typeof args.cmd == "undefined")
			throw "'cmd' est obligatoire";

		var cmd = this.replaceEnvVars(args.cmd);

		this.child = child_process.exec(cmd, {
			env: process.env
		});
		
		this.child.unref();
 
		var task = {
			stdout : "",
			stderr : ""
		}

		this.child.stdout.on('data', function (data) {
			task.stdout += data.toString();
		}.bind(this));

		this.child.stderr.on('data', function (data) {
			task.stderr += data.toString();
		}.bind(this));

		this.child.on('error', function(err) {
		   
			this.logger.error(err);
			task.stderr += err.toString();
			error(err);

		}.bind(this));

		this.child.on('close', function (code, signal) {
			    this.child = null;	 
			   // task.stdout = utf8.encode(task.stdout)
			  //  task.stderr = utf8.encode(task.stderr)
			    
				if (code != 0){
				 
					this.logger.warn("shellExec stdout="+task.stdout);
					this.logger.warn("shellExec stderr="+task.stderr);				
                    error("exitCode="+code+", stderr="+task.stderr+", stdout="+task.stdout)
				}else{
				    
					success({
					    output: task.stdout,
					    exitCode: code,
					    lastCheck: new Date,
					    perfdata: { 
						    ellapsed: new Date().getTime() - startTime.getTime()
					    }
				    });			    
				}

		}.bind(this)); 
		
		if (typeof this.child.pid == "undefined"){
		    this.child = null;
			error("Echec démarrage de la tâche. PID non défini");
		}
	}

	

}















































