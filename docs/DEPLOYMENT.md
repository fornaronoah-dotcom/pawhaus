# Deployment — Hetzner VPS + Docker + Nginx + Certbot

Deze gids beschrijft een productie-deployment op een Hetzner VPS met Docker,
Nginx als reverse proxy en een gratis SSL-certificaat via Certbot. Het domein
wordt gekoppeld via Combell.

> **Niet via Vercel.** De app gebruikt `output: "standalone"` (zie `next.config.ts`)
> en draait als een zelfstandige Node-server in een container.

---

## Overzicht van de flow
1. Repo clonen op de VPS
2. `.env` invullen
3. `docker compose up -d --build`
4. Nginx koppelen (reverse proxy)
5. SSL genereren met Certbot
6. Domein koppelen via Combell (DNS A-record)

---

## 0. Shopify koppelen (eenmalig)
1. Maak/gebruik een Shopify-store en installeer de **GOGETTERS**-app.
2. Ga in Shopify naar **Settings → Apps and sales channels → Develop apps →
   Create an app**.
3. Onder **Storefront API** → geef leesrechten op producten, collecties en
   **cart/checkout**. Installeer de app.
4. Kopieer de **Storefront API access token**.
5. Vul deze in `.env` in (zie stap 2). Zonder token draait de shop op mock-data.

---

## 1. Repo clonen
```bash
ssh root@<VPS_IP>
apt update && apt install -y git
git clone <REPO_URL> pawhaus
cd pawhaus
```

Installeer Docker + Compose-plugin als die er nog niet zijn:
```bash
curl -fsSL https://get.docker.com | sh
```

## 2. Environment invullen
```bash
cp .env.example .env
nano .env
```
Vul minimaal in:
```
SHOPIFY_STORE_DOMAIN=mijn-shop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-01
NEXT_PUBLIC_SITE_URL=https://jouwdomein.be
```

## 3. Container bouwen en starten
```bash
docker compose up -d --build
docker compose ps          # status
docker compose logs -f web # logs volgen
```
De app luistert nu lokaal op `127.0.0.1:3000` (niet publiek — Nginx ervoor).

Test: `curl http://127.0.0.1:3000/api/health` → `{"status":"healthy"}`.

## 4. Nginx koppelen
Installeer Nginx en plaats de meegeleverde config:
```bash
apt install -y nginx
cp nginx/pawhaus.conf /etc/nginx/sites-available/pawhaus.conf
# pas server_name aan naar jouw domein:
nano /etc/nginx/sites-available/pawhaus.conf
ln -s /etc/nginx/sites-available/pawhaus.conf /etc/nginx/sites-enabled/
mkdir -p /var/www/certbot
nginx -t && systemctl reload nginx
```

## 5. SSL genereren (Certbot)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d jouwdomein.be -d www.jouwdomein.be
```
Certbot past de Nginx-config automatisch aan voor HTTPS en stelt auto-renewal in.
Test renewal: `certbot renew --dry-run`.

## 6. Domein koppelen via Combell
In het Combell DNS-beheer:
- **A-record**: `@` → `<VPS_IP>`
- **A-record**: `www` → `<VPS_IP>`

DNS-propagatie kan tot enkele uren duren. Daarna is de shop bereikbaar op
`https://jouwdomein.be`.

---

## Updaten / herdeployen
```bash
cd pawhaus
git pull
docker compose up -d --build
```

## Troubleshooting
- **502 Bad Gateway** → container draait niet of niet op poort 3000:
  `docker compose logs web`.
- **Afbeeldingen laden niet** → controleer `images.remotePatterns` in
  `next.config.ts` (Shopify CDN = `cdn.shopify.com`).
- **Checkout doet niets** → demo-modus actief: vul de Storefront token in.
- **Health check rood** → `curl 127.0.0.1:3000/api/health` op de host.
