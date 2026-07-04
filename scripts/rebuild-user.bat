@echo off
echo === stop old instance === > C:\Users\DELL\careerpilot\logs\user-rebuild.txt
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -like '*user-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; 'stopped PID '+$_.ProcessId }" >> C:\Users\DELL\careerpilot\logs\user-rebuild.txt 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; 'stopped port-8081 owner PID '+$_.OwningProcess }" >> C:\Users\DELL\careerpilot\logs\user-rebuild.txt 2>&1
timeout /t 3 /nobreak > nul
cd /d C:\Users\DELL\careerpilot\backend\user-service
echo === BUILD === >> ..\..\logs\user-rebuild.txt
call mvn -q -DskipTests package >> ..\..\logs\user-rebuild.txt 2>&1
e