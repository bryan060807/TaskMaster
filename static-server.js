import express from "express";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const root = path.join(__dirname, "build", "client");
const apiOrigin = process.env.TASKMASTER_API_ORIGIN || "http://127.0.0.1:3101";
const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function buildUpstreamUrl(requestPath) {
  const normalizedPath = requestPath.startsWith("/api/auth")
    ? requestPath.replace(/^\/api\/auth(?=\/|$)/, "/auth")
    : requestPath;

  return new URL(normalizedPath, apiOrigin);
}

function buildProxyHeaders(headers) {
  const proxyHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();

    if (!value || normalizedKey === "host" || normalizedKey === "content-length" || hopByHopHeaders.has(normalizedKey)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        proxyHeaders.append(key, item);
      }
      continue;
    }

    proxyHeaders.set(key, value);
  }

  return proxyHeaders;
}

async function proxyToApi(req, res) {
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    const upstream = await fetch(buildUpstreamUrl(req.originalUrl), {
      method: req.method,
      headers: buildProxyHeaders(req.headers),
      body: hasBody ? req : undefined,
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (!hopByHopHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error("taskmaster-app proxy error", error);
    res.status(502).json({ error: "TaskMaster API unavailable" });
  }
}

app.use("/api/auth", proxyToApi);
app.use("/api", proxyToApi);

app.use(express.static(root));

app.get("*", (_req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

const port = process.env.PORT || 3100;
app.listen(port, "0.0.0.0", () => {
  console.log(`taskmaster-app static server listening on ${port}`);
});
