#!/usr/bin/env bash
# Pull the latest code and restart the prototype. Run on the server:
#   ~/digital-sickle/prototype/deploy/update.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_DIR"

echo "Updating $REPO_DIR ..."
git pull --ff-only
cd prototype
npm ci --omit=dev
sudo systemctl restart digital-sickle
echo
echo "Done. Recent status:"
systemctl --no-pager --lines=5 status digital-sickle || true
