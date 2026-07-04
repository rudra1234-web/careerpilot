@echo off
cd /d C:\Users\DELL\careerpilot
powershell -NoProfile -Command "try { $t=(Invoke-RestMethod -Uri 'http://localhost:8180/realms/master/protocol/openid-connect/token' -Method Post -Body @{username='admin';password='admin';grant_type='password';client_id='admin-cli'}).access_token; 'token ok' | Out-File keycloak-setup2.txt; try { Invoke-RestMethod -Uri 'http://localhost:8180/admin/realms' -Method Post -Headers @{Authorization=('Bearer '+$t)} -ContentType 'application/json' -InFile 'aws\keycloak-realm.json'; 'realm created' | Out-File -Append keycloak-setup2.txt } catch { ('realm error: '+$_.Exception.Message) | Out-File -Append keycloak-setup2.txt }; $r=Invoke-RestMethod -Uri 'http://localhost:8180/realms/careerpilot'; ('realm check: '+$r.realm) | Out-File -Append keycloak-setup2.txt } catch { ('token error: '+$_.Exception.Message) | Out-File keycloak-setup2.txt }"
echo === END === >> keycloak-setup2.txt
exit
