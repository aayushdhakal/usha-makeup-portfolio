# Usha Makeup and Nails

Public portfolio site for the New Baneshwor studio.

## Local setup

```bash
npm ci
npm run dev
```

## Fix 503 on shared hosting

The site is a **static export**. Runtime only needs `server.js` + the `out` folder.

### Option A — Node app (recommended if panel uses Node)

1. Startup file: `server.js`
2. Node 18+ (20+ preferred)
3. In the app folder:

```bash
npm ci
npm run build
npm start
```

4. Restart the Node app  
5. Confirm `out/index.html` exists after build

### Option B — No Node (most reliable)

1. Run `npm ci && npm run build` locally
2. Upload **everything inside** `out/` into `public_html`
3. Also upload `.htaccess`
4. Turn off / remove the Node.js app for this domain
