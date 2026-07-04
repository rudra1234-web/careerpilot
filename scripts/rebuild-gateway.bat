@echo off
echo === stop old instance === > C:\Users\DELL\careerpilot\logs\gateway-rebuild.txt
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -like '*api-gateway-1.0.0.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; 'stopped PID '+$_.ProcessId }" >> C:\Users\DELL\careerpilot\logs\gateway-rebuild.txt 2>&1
timeout /t 3 /nobreak > nul
cd /d C:\Users\DELL\careerpilot\backend\api-gateway
echo === BUILD === >> ..\..\logs\gateway-rebuild.txt
call mvn -q -DskipTests package >> ..\..\logs\gateway-rebuild.txt 2>&1
echo build exit: %errorlevel% >> ..\..\logs\gateway-rebuild.txt
if not "%errorlevel%"=="0" exit
cd /d C:\Users\DELL\careerpilot
start "api-gateway" /min cmd /c "java -Duser.timezone=Asia/Kolkata -jar backend\api-gateway\target\api-gateway-1.0.0.jar > logs\api-gateway.log 2>&1"
echo === restarted === >> logs\gateway-rebuild.txt
exit
