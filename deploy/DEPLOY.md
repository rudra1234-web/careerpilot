# Deploying CareerPilot for free — full stack, every feature working

CareerPilot is a 10-container microservices platform (5 Spring Boot services,
Postgres, Mongo, Kafka, Keycloak, Redis, Zipkin, an Angular UI). To run **every**
feature — auth, the Kafka resume→profile→questions SAGA, AI generation, file
uploads — you need one machine with enough RAM. The only genuinely free option
that fits is an **Oracle Cloud "Always Free" ARM VM (4 cores / 24 GB RAM,
free forever)**. Everything below runs the whole stack on that one VM behind
automatic HTTPS.

> Typical free app hosts (Render/Koyeb/Fly free tiers) give ~512 MB and spin
> down — they cannot boot Kafka + Keycloak + 5 JVMs + 2 databases. That's why
> this guide uses the Oracle always-free VM instead.

---

## What's in this folder

| File | Purpose |
|---|---|
| `docker-compose.prod.yml` | The whole stack, one command |
| `Caddyfile` | HTTPS reverse proxy — one domain, no CORS |
| `Dockerfile.service` | Builds each Spring Boot service (Maven runs *inside* Docker) |
| `frontend.Dockerfile` + `nginx.conf` | Angular build → nginx |
| `keycloak-realm.prod.json` | Realm import (signup enabled, demo user) |
| `.env.example` | Secrets + your domain |
| `setup.sh` | Generates the realm for your domain and brings the stack up |

The frontend was made **domain-agnostic** (it calls `/api` and `<origin>/auth`
at runtime), so you never rebuild it per domain.

---

## Step 1 — Create the Oracle Always Free VM

1. Sign up at <https://www.oracle.com/cloud/free/>. A card is required for
   identity verification but the "Always Free" resources are never charged.
2. Console → **Compute → Instances → Create instance**.
   - **Image:** Ubuntu 22.04.
   - **Shape:** *Ampere* → **VM.Standard.A1.Flex**. Set **4 OCPUs / 24 GB RAM**
     (the full always-free allowance). If you see "out of capacity", switch the
     Availability Domain or retry later — ARM capacity is regional.
   - **SSH keys:** upload/download a key pair so you can log in.
3. After it boots, note the **public IPv4 address**.

## Step 2 — Open the firewall (both layers)

Oracle blocks ports at two levels; open **80** and **443** in both.

1. **VCN Security List / NSG:** Networking → your VCN → Security List → add
   **Ingress** rules: source `0.0.0.0/0`, TCP, dest ports **80** and **443**.
2. **On the VM** (Oracle Ubuntu images ship with iptables locked down):
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

## Step 3 — Install Docker

SSH in (`ssh -i your-key ubuntu@<PUBLIC_IP>`), then:
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER && newgrp docker
```

## Step 4 — Get the code onto the VM

Push your repo to GitHub, then clone it (or `scp` it up):
```bash
git clone <your-repo-url> careerpilot
cd careerpilot/deploy
```

## Step 5 — Configure `.env`

```bash
cp .env.example .env
nano .env
```
Set:
- `PUBLIC_HOST` — a domain pointing at the VM, or the no-domain shortcut
  **`<PUBLIC_IP>.sslip.io`** (e.g. `129.153.10.20.sslip.io`). `sslip.io`
  resolves that name to your IP so Caddy can still get a real certificate.
- `ANTHROPIC_API_KEY` — your key (AI features need it).
- Change `POSTGRES_PASSWORD` and `KEYCLOAK_ADMIN_PASSWORD`.

> Using a real domain instead? Create an **A record** → VM public IP, put the
> bare hostname in `PUBLIC_HOST`, and wait for DNS to resolve before Step 6
> (Caddy needs it reachable to issue the certificate).

## Step 6 — Launch everything

```bash
chmod +x setup.sh
./setup.sh
```
First run builds all five services with Maven inside Docker — expect
**10–20 minutes**. Watch progress:
```bash
docker compose -f docker-compose.prod.yml logs -f
```
When it settles, open **`https://<PUBLIC_HOST>/`**.

---

## Step 7 — Verify every feature works

| Feature | Check |
|---|---|
| HTTPS + app loads | `https://<PUBLIC_HOST>/` shows the landing page, valid padlock |
| Auth / signup | Click **Register**, create an account, log in (or use `demo` / `demo123`) |
| Keycloak admin | `https://<PUBLIC_HOST>/auth/` → admin console (admin / your pw) |
| Resume upload → SAGA | Upload a resume; watch it flow: `docker compose -f docker-compose.prod.yml logs -f resume-service user-service question-service` — you should see skills extracted → `profile.updated` → questions generated |
| AI generation | Start a session; questions appear (needs a valid `ANTHROPIC_API_KEY`) |
| Databases persist | `docker exec -it deploy-postgres-1 psql -U careerpilot -d careerpilot -c "select count(*) from user_profiles;"` |
| Tracing | Traces are collected by Zipkin (internal; expose port 9411 temporarily if you want the UI) |

Health of a single service:
```bash
docker compose -f docker-compose.prod.yml exec api-gateway wget -qO- http://user-service:8080/actuator/health
```

---

## Everyday operations

```bash
# status
docker compose -f docker-compose.prod.yml ps

# tail logs
docker compose -f docker-compose.prod.yml logs -f <service>

# rebuild one service after a code change
docker compose -f docker-compose.prod.yml up -d --build user-service

# stop / start all
docker compose -f docker-compose.prod.yml stop
docker compose -f docker-compose.prod.yml start

# full teardown (keeps data volumes)
docker compose -f docker-compose.prod.yml down
```

Data lives in named volumes (`pgdata`, `mongodata`, `kafkadata`, `resumedata`,
`caddy_data`) and survives restarts. `docker compose ... down -v` **deletes**
them — don't use `-v` unless you want a clean slate.

---

## Notes & gotchas

- **ARM images:** every image used here (Postgres, Mongo, Kafka, Keycloak,
  Redis, Zipkin, Caddy, Temurin, Node, nginx) publishes arm64 variants, so they
  run natively on the Ampere VM.
- **Memory:** each JVM is capped at 384 MB (`Dockerfile.service`). Total steady
  state is comfortably under the 24 GB budget.
- **No CORS config needed:** the browser only ever hits one origin; Caddy
  forwards `/api` and `/auth` internally.
- **Keycloak mode:** runs `start-dev` with an H2 store for simplicity (no extra
  DB). Fine for a personal/demo deploy. For a hardened setup, switch to
  `start` with `KC_DB=postgres` pointing at the Postgres service.
- **Cost:** everything here stays inside Oracle's Always Free limits. The only
  paid thing you *could* add is a custom domain; `sslip.io` keeps it $0.
