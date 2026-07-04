@echo off
echo === stop old instance === > C:\Users\DELL\careerpilot\logs\resume-rebuild.txt
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -like '*resume-service-1.0.0.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; 'stopped PID '+$_.ProcessId }" >> C:\Users\DELL\careerpilot\logs\resume-rebuild.txt 2>&1
timeout /t 3 /nobreak > nul
cd /d C:\Users\DELL\careerpilot\backend\resume-service
echo === BUILD === >> ..\..\logs\resume-rebuild.txt
call mvn -q -DskipTests package >> ..\..\logs\resume-rebuild.txt 2>&1
echo build exit: %errorlevel% >> ..\..\logs\resume-rebuild.txt
if not "%errorlevel%"=="0" exit
cd /d C:\Users\DELL\careerpilot
start "resume-service" /min cmd /c "java -Duser.timezone=Asia/Kolkata -jar backend\resume-service\target\resume-service-1.0.0.jar > logs\resume-service.log 2>&1"
echo === restarted === >> logs\resume-rebuild.txt
exit
