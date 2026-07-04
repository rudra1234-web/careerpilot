@echo off
cd /d C:\Users\DELL\careerpilot
if not exist logs mkdir logs
start "user-service" /min cmd /c "java -jar backend\user-service\target\user-service-1.0.0.jar > logs\user-service.log 2>&1"
start "question-service" /min cmd /c "java -jar backend\question-service\target\question-service-1.0.0.jar > logs\question-service.log 2>&1"
start "resume-service" /min cmd /c "java -jar backend\resume-service\target\resume-service-1.0.0.jar > logs\resume-service.log 2>&1"
start "progress-service" /min cmd /c "java -jar backend\progress-service\target\progress-service-1.0.0.jar > logs\progress-service.log 2>&1"
start "api-gateway" /min cmd /c "java -jar backend\api-gateway\target\api-gateway-1.0.0.jar > logs\api-gateway.log 2>&1"
start "frontend" /min cmd /c "cd /d C:\Users\DELL\careerpilot\frontend\careerpilot-ui && call npx ng serve > ..\..\logs\frontend.log 2>&1"
exit
