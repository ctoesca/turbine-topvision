
"use strict";


const BasePlugin = require('../BasePlugin/plugin.js');

module.exports = class CheckStats extends BasePlugin {

	constructor( opt ){
		super( opt );
		this.daoServices = app.getDao("Service");
	}

	exec(args, success, error){

		var startTime = new Date();
		
		var SQL = "(select 'avg_check_interval' as stat, \
			(select AVG(last_check_interval)  from view_services where enabled=1) as value)	\
		UNION all \
		(select 'avg_ellapsed' as stat, \
			(select AVG(ellapsed)  from view_services where enabled=1 and ellapsed IS NOT NULL and current_state = 0) as value )";
	
		this.daoServices.query(	SQL ).then(

			function(rows){
			
				var output = "ok\n";
				for (var i=0; i<rows.length; i++){
					var item = rows[i];					
					output += item.stat+"="+item.value+"\n";	
				}
				
				success({
					output: output,
					exitCode: 0,
					lastCheck: new Date,
					perfdata: { 
						ellapsed: new Date().getTime() - startTime.getTime()
					}
				});

			},
			function(err){
			    error(err)
			}
		).catch( function(err){
		  
		    error("CATCH "+err)
		})


		/*var aql = `LET avg_ellapsed = (
		FOR u IN services
		    FILTER u.current_state == 0
		    COLLECT AGGREGATE value = AVERAGE(u.ellapsed)
		    return value
		)

		LET avg_check_interval = (
		FOR u IN services
		    COLLECT AGGREGATE value = AVERAGE( DATE_TIMESTAMP(u.last_check)/1000 - DATE_TIMESTAMP(u.previous_check)/1000 )
		    return value
		)

		return {
		    avg_ellapsed:avg_ellapsed[0],
		    avg_check_interval: avg_check_interval[0]
		}`

		this.daoServices.query(

			aql,

			function(err, result){
				if (err){

					onCompleted({
						output: err.message,
						exitCode: 3,
						lastCheck: new Date,
						perfdata: {
							ellapsed: new Date().getTime() - startTime.getTime()
						}
					});
				}else{

					var output = "avg_ellapsed="+result[0].avg_ellapsed+"\n"+"avg_check_interval="+result[0].avg_check_interval;
					onCompleted({
						output: output,
						exitCode: 0,
						lastCheck: new Date,
						perfdata: { 
							ellapsed: new Date().getTime() - startTime.getTime()
						}
					});

				}
				var output = "";

			}.bind(this)
		);*/

	}

	

}




































































































