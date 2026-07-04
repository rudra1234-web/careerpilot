@echo off
echo === stop old instance === > C:\Users\DELL\careerpilot\logs\progress-rebuild.txt
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -like '*progress-service-1.0.0.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; 'stopped PID '+$_.ProcessId }" >> C:\Users\DELL\careerpilot\logs\progress-rebuild.txt 2>&1
timeout /t 3 /nobreak > nul
cd /d C:\Users\DELL\careerpilot\backend\progress-service
echo === BUILD === >> ..\..\logs\progress-rebuild.txt
call mvn -q -DskipTests package >> ..\..\logs\progress-rebuild.txt 2>&1
echo build exit: %errorlevel% >> ..\..\logs\progress-rebuild.txt
if not "%errorlevel%"=="0" exit
cd /d C:\Users\DELL\careerpilot
start "progress-service" /min cmd /c "java -Duser.timezone=Asia/Kolkata -jar backend\progress-service\target\progress-service-1.0.0.jar > logs\progress-service.log 2>&1"
echo === restarted === >> logs\progress-rebuild.txt
exit
