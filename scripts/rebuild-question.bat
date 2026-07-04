@echo off
echo === stop old instance === > C:\Users\DELL\careerpilot\logs\question-rebuild.txt
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { $_.CommandLine -like '*question-service*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; 'stopped PID '+$_.ProcessId }" >> C:\Users\DELL\careerpilot\logs\question-rebuild.txt 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; 'stopped port-8082 owner PID '+$_.OwningProcess }" >> C:\Users\DELL\careerpilot\logs\question-rebuild.txt 2>&1
timeout /t 3 /nobreak > nul
cd /d C:\Users\DELL\careerpilot\backend\question-service
echo === BUILD === >> ..\..\logs\question-rebuild.txt
call mvn -q -DskipTests package >> ..\..\logs\question-rebuild.txt 2>&1
echo build exit: %err