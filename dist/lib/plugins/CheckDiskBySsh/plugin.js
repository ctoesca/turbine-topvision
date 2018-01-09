"use strict";

const CheckSshByAgent = require('../CheckSshByAgent/plugin.js');

module.exports = class CheckDiskBySsh extends CheckSshByAgent {

	constructor( opt ){
		super( opt );
	}

	exec(args, success, error){
	    args.script = "df"
	    

        super.exec(args, success, error) 
	}
    processResult( stdout, stderr, exitCode, args){
        
        /*
        Filesystem           1K-blocks     Used  Available Use% Mounted on
        udev                   8192680        0    8192680   0% /dev
        tmpfs                  1642364   176216    1466148  11% /run
        /dev/sda3             20026236  4068052   14917852  22% /
        tmpfs                  8211808        0    8211808   0% /dev/shm
        tmpfs                     5120        0       5120   0% /run/lock
        tmpfs                  8211808        0    8211808   0% /sys/fs/cgroup
        /dev/sda2               990488    55892     867064   7% /boot
        /dev/mapper/vg-logs    9943916   393772    9021968   5% /var/log
        /dev/mapper/vg-home 1887444056 65788332 1725756076   4% /home
        tmpfs                  1642364        0    1642364   0% /run/user/1005
        */
        var fsList = {}
        
        var lines = stdout.split("\n")
    
        try{
            
            for (var i=1; i<lines.length; i++){
            
                lines[i] = lines[i].trim();
                
                if (lines[i] != "")
                { 
                    var line = lines[i].replace(/\s+/g, " ");
                    var parts = line.split(" ");
                    
                    if (parts.length > 1)
                    {
                        var mountedOn = parts[5]
                 
                        fsList[mountedOn] = {
                            mountedOn: mountedOn,
                            used:  parts[4].replace("%",""),
                            fsList: parts[0]
                        }     
                    }else{
                        throw "Le retour de la commande 'df' est incorrect"
                    }
                    
                }
            }
      
        
            var exitCode = 0;
            var output = "";
            for (var i=0; i<args.fs.length; i++)
            {
                var mountedOn = args.fs[i].path;
                
                if (typeof fsList[mountedOn] == "undefined"){
                    if (exitCode == 0)
                        exitCode = 3;
                    output += mountedOn+": filesystem does not exists\n"
                }else{
                    var currentFs = fsList[mountedOn]
                   
                    if (currentFs.used >= args.warn){
                        output += mountedOn+" WARN : "+currentFs.used+"% used\n"      
                        if (exitCode != 2)
                            exitCode = 1;
                    }
                    else if (currentFs.used >= args.critic)
                    {
                        exitCode = 2;
                        output += mountedOn+" CRITIC : "+currentFs.used+"% used\n"      
                    }else{
                        output += mountedOn+" OK : "+currentFs.used+"% used\n"
                    }
                
                }
              
            }
            
            
            
        }catch(err){
            
            output = err.toString()
            exitCode = 3
            
        }
       
		return {
                output: output,
                exitCode: exitCode
        }
                
    }
}




































