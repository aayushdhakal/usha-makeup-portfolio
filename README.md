# Usha Makeup and Nails – portfolio

Public portfolio site. Built as a static Next export, served by Express on cPanel Passenger — same deploy style as `usha-makeup`.

```
app.js          Passenger startup file (listens on process.env.PORT)
out/            built static site  ← commit this after every build
public/         source images/fonts
app/            Next.js pages (source)
```

> **Built files are committed on purpose.** The server never runs `next build` — it only needs
> `npm install --omit=dev` and a restart. Always `npm run build` locally before deploying.

## Local

```bash
npm install
npm run dev      # edit pages
npm run build    # writes out/
npm start        # serve out/ via app.js
```

## Deploy to Bisup (cPanel → Setup Node.js App)

| Setting | Value |
| --- | --- |
| Node.js version | **22.x** (same as usha-makeup — never 18) |
| Application mode | Production |
| Application root | folder that contains `app.js` (this repo root) |
| Application URL | your domain (path empty) |
| Application startup file | **`app.js`** |

Do **not** set `PORT` — Passenger provides it.

### On the server

```bash
# enter the Node virtualenv from the Setup Node.js App page, then:
npm install --omit=dev
mkdir -p tmp && touch tmp/restart.txt
```

Or use **Run NPM Install** + **Restart** in the Node.js App UI.

### Update flow

```bash
# laptop
npm run build
git add -A && git commit -m "Build portfolio" && git push

# server: Git pull, then Restart (or touch tmp/restart.txt)
```
