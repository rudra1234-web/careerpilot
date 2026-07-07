#!/usr/bin/env bash
# =====================================================================
# One-shot deploy helper. Run from the deploy/ directory on the VM.
#   ./setup.sh
# It: (1) loads .env, (2) generates the Keycloak realm with your real
# domain baked in, (3) builds and starts the whole stack.
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy .env.example to .env and fill it in first."
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

if [[ -z "${PUBLIC_HOST:-}" ]]; then
  echo "ERROR: PUBLIC_HOST is empty in .env"
  exit 1
fi

PUBLIC_URL="https://${PUBLIC_HOST}"
echo ">> Public URL: ${PUBLIC_URL}"

# Bake the domain into a realm file Keycloak will import.
mkdir -p keycloak-import
sed "s#__PUBLIC_URL__#${PUBLIC_URL}#g" keycloak-realm.prod.json > keycloak-import/careerpilot-realm.json
echo ">> Wrote keycloak-import/careerpilot-realm.json"

echo ">> Building and starting the stack (first build downloads Maven deps; be patient)..."
docker compose --env-file .env -f docker-compose.prod.yml up -d --build

echo ""
echo ">> Done. Watch startup with:"
echo "     docker compose -f docker-compose.prod.yml logs -f"
echo ">> App will be live at: ${PUBLIC_URL}"
