/**
 * Lightweight local API server for development.
 * Mirrors Vercel's serverless function routing for /api/* routes.
 * Vite proxies /api/* to this server (port 3002).
 */
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3002;

// Load .env manually (no dotenv dependency needed)
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // no .env file — that's fine
}

// Route map: URL pattern → handler file (relative to project root)
const routes = [
  { pattern: /^\/api\/admin\/jobs\/([^/]+)$/, file: 'api/admin/jobs/[id].ts', param: 'id' },
  { pattern: /^\/api\/admin\/jobs\/?$/, file: 'api/admin/jobs/index.ts' },
  { pattern: /^\/api\/admin\/login\/?$/, file: 'api/admin/login.ts' },
  { pattern: /^\/api\/admin\/emails\/?$/, file: 'api/admin/emails.ts' },
  { pattern: /^\/api\/jobs\/([^/]+)\/view\/?$/, file: 'api/jobs/[slug]/view.ts', param: 'slug', paramIdx: 0 },
  { pattern: /^\/api\/jobs\/([^/]+)\/?$/, file: 'api/jobs/[slug].ts', param: 'slug' },
  { pattern: /^\/api\/jobs\/?$/, file: 'api/jobs/index.ts' },
  { pattern: /^\/api\/generate\/?$/, file: 'api/generate.ts' },
  { pattern: /^\/api\/record-email\/?$/, file: 'api/record-email.ts' },
];

// Cache of imported handlers (tsx files compiled via tsx/ts-node on-the-fly)
const handlerCache = new Map();

async function getHandler(file) {
  if (handlerCache.has(file)) return handlerCache.get(file);
  const absPath = resolve(__dirname, file);
  const mod = await import(pathToFileURL(absPath).href);
  const handler = mod.default;
  handlerCache.set(file, handler);
  return handler;
}

function bodyToString(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  const pathname = url.split('?')[0];

  // Find matching route
  let matched = null;
  let params = {};
  for (const route of routes) {
    const m = pathname.match(route.pattern);
    if (m) {
      matched = route;
      if (route.param) params[route.param] = m[1];
      break;
    }
  }

  if (!matched) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No API route for ${pathname}` }));
    return;
  }

  try {
    const handler = await getHandler(matched.file);

    // Build a Web API Request object the handler expects
    const body = await bodyToString(req);
    const fullUrl = `http://localhost:${PORT}${url}`;
    const headers = new Headers(req.headers);

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body || undefined,
    });

    const webResponse = await handler(webRequest);

    res.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));
    const resBody = await webResponse.text();
    res.end(resBody);
  } catch (err) {
    console.error(`[api-server] Error handling ${pathname}:`, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[api-server] API dev server running on http://localhost:${PORT}`);
});
