import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

// Shared hosts often set HOSTNAME to the machine name — do not bind to that.
if (process.env.NODE_ENV !== "development") {
  process.env.NODE_ENV = "production";
}

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    }).listen(port, hostname, () => {
      console.log(`Ready on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
