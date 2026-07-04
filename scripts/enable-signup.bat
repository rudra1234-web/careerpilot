@echo off
cd /d C:\Users\DELL\careerpilot
powershell -NoProfile -Command "$t=(Invoke-RestMethod -Uri 'http://localhost:8180/realms/master/protocol/openid-connect/token' -Method Post -Body @{username='admin';password='admin';grant_type='password';client_id='admin-cli'}).access_token; $h=@{Authorization=('Bearer '+$t)}; $realm=Invoke-RestMethod -Uri 'http://localhost:8180/admin/realms/careerpilot' -Headers $h; $realm.registrationAllowed=$true; $realm.loginWithEmailAllowed=$true; $realm.rememberMe=$true; Invoke-RestMethod -Uri 'http://localhost:8180/admin/realms/careerpilot' -Method Put -Headers $h -ContentType 'application/json' -Body ($realm | ConvertTo-Json -Depth 10); $check=Invoke-RestMethod -Uri 'http://localhost:8180/admin/realms/careerpilot' -Headers $h; ('registrationAllowed: '+$check.registrationAllowed) | Out-File -Encoding ascii signup-setup.txt"
echo === END === >> signup-setup.txt
exit
