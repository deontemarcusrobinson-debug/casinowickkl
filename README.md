# GoldWitch (casinowick)

Node.js / Express casino — deploy on **Render** (not GitHub Pages).

## Deploy on Render

### 1) Put this repo on GitHub
Upload the **full** project (all folders including `docker/`). Never commit `.env`.

### 2) Blueprint deploy
1. [render.com](https://render.com) → **New** → **Blueprint**
2. Connect this repo (`render.yaml` creates web + MySQL)
3. Wait until **goldwitch** and **goldwitch-mysql** are Live
4. Open your `https://….onrender.com` URL

Boot creates the DB, migrates tables, and starts. `APP_URL` auto-fills from Render if left blank.

### 3) Custom domain
Web service → **Settings** → **Custom Domains** → paste your domain → add the DNS records Render shows.

### 4) Payments (optional)
Add `PAYPAL_*` / `DRAKON_*` under **Environment** → Manual Deploy.

See `DEPLOY.txt` for the full checklist.

## Local (optional)

```bash
cp .env.example .env
npm install
npm run init
npm run build
npm run start:local
```

## Important
`*.github.io` = GitHub Pages = **README only**. Your live casino URL comes from **Render**.
