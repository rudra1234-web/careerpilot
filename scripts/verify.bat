@echo off
cd /d C:\Users\DELL\careerpilot
echo === containers === > verify.txt
call docker compose ps >> verify.txt 2>&1
echo === gateway 8080 === >> verify.txt
curl -s -o nul -w "%%{http_code}" http://localhost:8080/actuator/health >> verify.txt
echo. >> verify.txt
echo === user 8081 === >> verify.txt
curl -s http://localhost:8081/actuator/health >> verify.txt
echo. >> verify.txt
echo === question 8082 === >> verify.txt
curl -s http://localhost:8082/actuator/health >> verify.txt
echo. >> verify.txt
echo === resume 8083 === >> verify.txt
curl -s http://localhost:8083/actuator/health >> verify.txt
echo. >> verify.txt
echo === progress 8084 === >> verify.txt
curl -s http://localhost:8084/actuator/health >> verify.txt
echo. >> verify.txt
echo === frontend 4200 === >> verify.txt
curl -s -o nul -w "%%{http_code}" http://localhost:4200 >> verify.txt
echo. >> verify.txt
echo === keycloak 8180 === >> verify.txt
curl -s -o nul -w "%%{http_code}" http://localhost:8180/realms/master >> verify.txt
echo. >> verify.txt
echo === END === >> verify.txt
exit
