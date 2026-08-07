// Entry point for running the server as a long-lived process (local dev,
// Docker, Fly, Railway, a VPS...). Serverless hosts (Vercel) import
// `app.js` directly instead and never call `.listen()` — see /api/index.js
// at the repo root.
import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Five-Day Split Tracker listening on port ${PORT}`);
});
