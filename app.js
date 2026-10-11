'use strict';

/**
 * Passenger startup file (cPanel "Setup Node.js App" → Application startup file: app.js).
 * Same pattern as usha-makeup/server/app.js: listen on process.env.PORT and export the app.
 * Serves the static Next export from ./out
 */

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');

const outDir = path.join(__dirname, 'out');
const indexFile = path.join(outDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('Missing out/index.html. Run "npm run build" locally, commit out/, then deploy.');
  process.exit(1);
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  express.static(outDir, {
    index: 'index.html',
    extensions: ['html'],
    maxAge: '7d',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.use((req, res) => {
  const notFound = path.join(outDir, '404.html');
  if (fs.existsSync(notFound)) {
    res.status(404).sendFile(notFound);
    return;
  }
  res.status(404).type('text').send('Not found');
});

// Passenger sets PORT; locally default to 3000. Do not set PORT in cPanel.
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Usha portfolio listening on ${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
    process.exit(1);
  }
  throw err;
});

module.exports = app;
