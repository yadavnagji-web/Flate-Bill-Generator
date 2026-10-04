import app from "./index.js";

// Catch-all serverless function for /api/* on Vercel
export default function handler(req: any, res: any) {
  return app(req, res);
}
