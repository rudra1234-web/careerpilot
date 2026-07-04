@echo off
cd /d C:\Users\DELL\careerpilot
echo === BUILD START === > build-log.txt
for %%S in (user-service question-service resume-service progress-service api-gateway) do (
  echo === %%S === >> build-log.txt
  cd /d C:\Users\DELL\careerpilot\backend\%%S
  call mvn -q -DskipTests package >> C:\Users\DELL\careerpilot\build-log.txt 2>&1
  echo exitcode %%S: !errorlevel! >> C:\Users\DELL\careerpilot\build-log.txt
)
cd /d C:\Users\DELL\careerpilot
echo === BUILD DONE === >> build-log.txt
exit
