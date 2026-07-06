@echo off
echo === stopping CareerPilot === > C:\Users\DELL\careerpilot\stop-result.txt
powershell -NoProfile -Command "8080,8081,8082,8083,8084,4200 | ForEach-Object { Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; 'stopped PID '+$_ }" >> C:\Users\DELL\careerpilot\stop-result.txt 2>&1
cd /d C:\Users\DELL\careerpilot
call docker compose stop >> C:\Users\DELL\careerpilot\stop-result.txt 2>&1
echo === all stopped === >> C:\Users\DELL\careerpilot\stop-result.txt
exit
