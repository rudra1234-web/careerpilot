# CareerPilot — Operations Runbook

Everything you need to run, watch, and debug the platform yourself.

---

## 1. Starting everything (e.g. after a reboot)

| Step | Action |
|---|---|
| 1 | Start **Docker Desktop**, wait for "Engine running" (bottom-left) |
| 2 | If containers are stopped: `docker compose up -d` in the project folder (or Docker Desktop → Containers → careerpilot → Start) |
| 3 | Double-click **`scripts/run-services.bat`** — starts all five services + the Angular dev server, each in a minimized window |
| 4 | Run **`scripts/verify.bat`**, open `verify.txt` — expect five `{"status":"UP"}` plus 200s |
| 5 | Open **http://localhost:4200** |

Stopping: close the minimized `cmd` windows (or Task Manager → java.exe / node.exe), then `docker compose stop`.

Rebuilding one service after a code change: `scripts/rebuild-<service>.bat`.

### Key URLs
| What | URL |
|---|---|
| App | http://localhost:4200 |
| API gateway | http://localhost:8080 |
| Keycloak admin | http://localhost:8180 (admin / admin) |
| Zipkin traces | http://localhost:9411 |
| Service health | http://localhost:808X/actuator/health (X = 1..4) |

---

## 2. Watching logs

All services write to `logs\<service>.log`. Live-tail in PowerShell:

```powershell
Get-Content C:\Users\DELL\careerpilot\logs\question-service.log -Wait -Tail 50
```

Files: `api-gateway.log`, `user-service.log`, `question-service.log`,
`resume-service.log`, `progress-service.log`, `frontend.log`.

What to look for during a resume upload (the SAGA):
1. `resume-service.log` — upload processed, skills extracted
2. `user-service.log` — `SAGA step 2: profile updated + profile.updated queued`
3. `user-service.log` — `Outbox -> Kafka: topic=profile.updated`
4. `question-service.log` — `SAGA step 3 complete: 5 questions generated`

---

## 3. Checking the databases

### PostgreSQL (user profiles) — via pgAdmin
Host `localhost`, port `5432`, database/user/password: `careerpilot`.

```sql
select keycloak_sub, full_name, email, target_role, skills, updated_at
from user_profiles;

select * from outbox_events order by created_at desc limit 10;
```

Or without pgAdmin:
```powershell
docker exec careerpilot-postgres-1 psql -U careerpilot -d careerpilot -c "select keycloak_sub, full_name, left(skills,60) as skills from user_profiles;"
```

### MongoDB (questions, answers, weak areas)
```powershell
# how many questions exist
docker exec careerpilot-mongo-1 mongosh careerpilot --eval "db.interview_questions.countDocuments()"

# recent questions with scores and your answers
docker exec careerpilot-mongo-1 mongosh careerpilot --eval "db.interview_questions.find({answeredAt:{$ne:null}},{question:1,score:1,weakAreaTag:1}).sort({answeredAt:-1}).limit(5)"

# roadmap weak areas
docker exec careerpilot-mongo-1 mongosh careerpilot --eval "db.weak_areas.find()"
```
(GUI alternative: MongoDB Compass → `mongodb://localhost:27017`.)

---

## 4. Watching Kafka events live

```powershell
docker exec careerpilot-kafka-1 /opt/bitnami/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic resume.parsed --from-beginning
```
Topics: `resume.parsed`, `profile.updated`, `questions.generated`,
`plan.failed`, `session.completed`. Ctrl+C to stop.

---

## 5. Distributed traces (Zipkin)

http://localhost:9411 → **Run Query** — every API call appears as a trace.
Upload a resume, then find the trace spanning
`gateway → resume-service → kafka → user-service → question-service`.

---

## 6. Common issues

| Symptom | Fix |
|---|---|
| Upload fails with 401/network | Log out/in (token expired) or hard-refresh (Ctrl+F5) |
| 429 on Start session | Daily generation quota (default 25) — resets at midnight, configurable via `usage.daily-generation-limit` |
| Service won't start, port in use | `scripts/rebuild-<service>.bat` kills the port owner first |
| Empty AI responses / 500s | Check `ANTHROPIC_API_KEY` is set: `echo %ANTHROPIC_API_KEY%` in a new terminal, then rebuild services |
| Postgres "TimeZone Asia/Calcutta" | Services must run with `-Duser.timezone=Asia/Kolkata` (the scripts do this) |
| Keycloak login page missing Register | Run `scripts/enable-signup.bat` |

---

## 7. Git

```powershell
git log --oneline          # history
git status                 # what changed
git add -A ; git commit -m "message"
```
Push to GitHub: create an empty repo there, then
`git remote add origin <url>` and `git push -u origin master`.
