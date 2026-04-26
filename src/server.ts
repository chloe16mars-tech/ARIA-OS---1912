import '@angular/compiler';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';

import { apiRouter } from './server/api.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserDistFolder = join(__dirname, '../browser');

const isProd = process.env['NODE_ENV'] === 'production';

const app = express();

// ── Trust proxy ──────────────────────────────────────────────────────────
// Required for `req.ip` to reflect the real client behind a reverse proxy
// (Vercel, Render, Fly, Nginx). Drives express-rate-limit and logging.
const trustProxy = Number.parseInt(process.env['TRUST_PROXY'] ?? '1', 10);
app.set('trust proxy', Number.isFinite(trustProxy) ? trustProxy : 1);

// ── Security headers ─────────────────────────────────────────────────────
// CSP is only relaxed in development (Angular dev-server needs eval). In
// production we ship a hashed bundle where 'self' is enough.
const helmetCsp = isProd
  ? {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'"],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'https://*.googleapis.com',
        ],
        'img-src': ["'self'", 'data:', 'blob:', 'https://*.supabase.co'],
        'media-src': ["'self'", 'blob:'],
      },
    }
  : {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'connect-src': ["'self'", 'ws:', 'http:', 'https:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      },
    };

app.use(helmet({ contentSecurityPolicy: helmetCsp }));

// ── CORS ─────────────────────────────────────────────────────────────────
// Origins come from env so we never ship placeholders to production.
const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (isProd && allowedOrigins.length === 0) {
  console.warn(
    '[server] ALLOWED_ORIGINS is empty in production. CORS will reject every cross-origin request.'
  );
}

app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin requests (no Origin header) and explicit allow-list pass.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} is not allowed`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

app.use(express.json({ limit: '64kb' }));

// ── API ──────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Static assets (production only — dev-server handles them in dev) ─────
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

// ── Angular SSR fallback ─────────────────────────────────────────────────
// Lazy-instantiated so `tsx` dev mode does not crash before the Angular
// manifest exists.
app.use((req, res, next) => {
  let angularApp: AngularNodeAppEngine;
  try {
    angularApp = new AngularNodeAppEngine();
  } catch {
    return next();
  }
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = Number.parseInt(process.env['PORT'] ?? '4000', 10);
  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port} (NODE_ENV=${process.env['NODE_ENV'] ?? 'development'})`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
