set _DIR=%~dp0

call %_DIR%\_loadVars.bat 

set nexilearn_path=G:/dev/nexilearn

cd /d %nexilearn_path%/turbine-modules/turbine-pubsub/trunk
call npm link
cd /d %_DIR%\..
call npm link turbine-pubsub


cd /d %nexilearn_path%/turbine2/trunk
call npm link
cd /d %_DIR%\..
call npm link turbine

pause