import '@angular/compiler';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import 'dotenv/config';
import { apiRouter } from './server/api.router.js';

// Compatible tsx (CJS) et ESM : import.meta.dirname peut être undefined sous tsx
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserDistFolder = join(__dirname, '../browser');

import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Configuration Helmet pour sécuriser les en-têtes HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Nécessaire pour Angular en dev
      "connect-src": ["'self'", "https://*.supabase.co", "https://*.googleapis.com"],
      "img-src": ["'self'", "data:", "https://*.supabase.co", "https://images.unsplash.com"],
    },
  },
}));

// Configuration CORS restrictive
// Configuration CORS pour autoriser le Web et le Mobile (Capacitor)
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' 
    ? ['https://votre-domaine.com', 'http://localhost', 'capacitor://localhost'] 
    : ['http://localhost:4200', 'http://localhost:3000', 'http://localhost', 'capacitor://localhost'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// API routes — disponibles en dev et en production
app.use('/api', apiRouter);

/**
 * Serve static files from /browser (production only)
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 * AngularNodeAppEngine est instanciée en lazy pour éviter un crash
 * en mode dev (tsx) où le manifest Angular n'est pas encore compilé.
 */
app.use((req, res, next) => {
  let angularApp: AngularNodeAppEngine;
  try {
    angularApp = new AngularNodeAppEngine();
  } catch {
    // En mode dev (tsx sans build Angular), on laisse passer — ng serve gère le frontend
    return next();
  }
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
