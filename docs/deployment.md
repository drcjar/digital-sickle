# Deploying the prototype to a small Ubuntu server

This runbook deploys the prototype to an existing Ubuntu host (e.g. an AWS Lightsail 512 MB
instance already running another nginx site) at **https://digital-sickle.carlreynolds.net**.

> The prototype uses **synthetic data only** and is **not a medical device**. Every page carries a
> prototype banner and the site is set to `noindex`.

Architecture: **nginx** (reverse proxy + TLS) → **Node app on `127.0.0.1:3000`**, kept alive by
**systemd**. The app uses SQLite — no separate database service.

All commands run **on the server** (SSH in first), as the `ubuntu` user.

---

## 0. Prerequisites / sanity check

```bash
free -m                 # confirm some RAM headroom (we add swap below regardless)
nginx -v                # confirm nginx is installed (it powers the existing site)
node -v 2>/dev/null || echo "node not installed yet"
```

## 1. DNS

In your DNS provider for `carlreynolds.net`, add an **A record**:

```
digital-sickle   →   <your Lightsail public IP>
```

Wait for it to resolve (`dig +short digital-sickle.carlreynolds.net` should return the IP).
In Lightsail, make sure the instance firewall allows **HTTP (80)** and **HTTPS (443)**.

## 2. Add swap (recommended on 512 MB)

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -m                 # should now show ~1024 MB swap
```

## 3. Install Node.js 22 (if not already present)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v                 # v22.x
```

## 4. Get the code

```bash
cd ~
git clone https://github.com/drcjar/digital-sickle.git
cd digital-sickle/prototype
npm ci --omit=dev       # installs runtime deps; better-sqlite3 uses a prebuilt binary
```

## 5. Create the production environment file

Generates strong random secrets — **do not commit this file** (it is git-ignored):

```bash
cat > ~/digital-sickle/prototype/.env <<EOF
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
SESSION_SECRET=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 32)
EOF
chmod 600 ~/digital-sickle/prototype/.env
```

## 6. Install the systemd service

```bash
sudo cp ~/digital-sickle/prototype/deploy/digital-sickle.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now digital-sickle
systemctl --no-pager status digital-sickle      # should be "active (running)"
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/   # expect 200
```

On first start the app creates and seeds its SQLite database under `prototype/data/`.

## 7. Configure nginx

```bash
sudo cp ~/digital-sickle/prototype/deploy/nginx-digital-sickle.conf \
        /etc/nginx/sites-available/digital-sickle
sudo ln -s /etc/nginx/sites-available/digital-sickle /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Visit `http://digital-sickle.carlreynolds.net/` — you should see the prototype (HTTP for now).

## 8. Add HTTPS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d digital-sickle.carlreynolds.net
```

Choose to redirect HTTP→HTTPS when prompted. Certbot edits the nginx config and sets up
auto-renewal. The app already issues secure cookies in production (it trusts the proxy's
`X-Forwarded-Proto`).

## 9. Verify

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://digital-sickle.carlreynolds.net/   # 200
```

Open the site, sign in with a seeded login (see `prototype/README.md`, password `Password123`),
and check the acute crisis view and audit pages.

---

## Updating after a code change

```bash
~/digital-sickle/prototype/deploy/update.sh
```

This pulls `main`, reinstalls runtime deps, and restarts the service.

## Resetting the demo data

```bash
sudo systemctl stop digital-sickle
rm -rf ~/digital-sickle/prototype/data
sudo systemctl start digital-sickle      # re-seeds synthetic data on boot
```

## Notes & limits

- This is a **prototype** on synthetic data. It is **not** an information-governed clinical system.
  Do not enter real patient data. Production hardening (CIS2 SSO, DPIA, antivirus-scanned uploads,
  clinical safety) is out of scope — see `docs/roadmap.md`.
- `MemoryMax=200M` in the unit caps the app so it can't starve the co-hosted site; raise it if you
  see the service restarting under load (`journalctl -u digital-sickle`).
- Logs: `journalctl -u digital-sickle -f`.
