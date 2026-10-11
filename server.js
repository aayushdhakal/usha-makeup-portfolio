import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const root = fileURLToPath(new URL("./out", import.meta.url));

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  const cleaned = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(root, cleaned);
}

async function resolveFile(urlPath) {
  let filePath = safePath(urlPath);
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, "index.html");
    else return filePath;
  } catch {
    if (!extname(filePath)) filePath = `${filePath}.html`;
  }
  await stat(filePath);
  return filePath;
}

createServer(async (req, res) => {
  try {
    const filePath = await resolveFile(req.url || "/");
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    res.end(body);
  } catch {
    try {
      const notFound = await readFile(join(root, "404.html"));
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(notFound);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Serving ./out on 0.0.0.0:${port}`);
});
