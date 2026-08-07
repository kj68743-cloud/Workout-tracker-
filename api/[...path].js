// Vercel serverless entry point. The catch-all filename routes every
// /api/* request here; the Express app underneath already expects the
// "/api" prefix on its routes (same app used for local dev/Docker/Fly via
// server/src/index.js), so no path rewriting is needed — just hand the
// request straight to it.
import app from '../server/src/app.js';

export default app;
