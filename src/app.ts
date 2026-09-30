import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import os from "os";
import { StatusCodes } from "http-status-codes";
import { Morgan } from "./shared/morgan";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import session from "express-session";

import helmet from "helmet";
import { apiLimiter } from "./services/rate-limiter";
import router from "./app/routes";
import handleStripeWebhook from "./helpers/handleStripeWebhook";
const app = express();

//! stripe
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: ["http://10.10.26.159:5173", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static("uploads"));
app.use(express.static("public"));

// Session middleware (must be before passport initialization)
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Secure should be true in production with HTTPS
  }),
);

// Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session());

//router
app.use("/api/v1", apiLimiter, router);

app.get("/", (_req: Request, res: Response) => {
  const currentTime = new Date().toLocaleString();
  const hostname = os.hostname();
  const instance =
    process.env.INSTANCE_NAME || process.env.HOSTNAME || hostname;
  const listenPort = process.env.PORT || "5005";
  const publicHost = _req.get("host") || `localhost:${listenPort}`;
  const colors: Record<string, string> = {
    server1: "#1d4ed8",
    server2: "#047857",
    server3: "#b45309",
  };
  const accent = colors[instance] || "#6d28d9";

  res.setHeader("X-Backend-Instance", instance);
  res.setHeader("X-Backend-Port", String(listenPort));
  res.setHeader("X-Backend-Hostname", hostname);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${instance} · port ${listenPort}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #111;
          color: white;
          text-align: center;
          padding: 72px 24px;
          margin: 0;
        }
        h1 {
          font-size: 2.6rem;
          margin-bottom: 12px;
        }
        p {
          font-size: 1.2rem;
          margin: 12px 0;
        }
        .badge {
          display: inline-block;
          background: ${accent};
          color: white;
          font-size: 2.4rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 16px 32px;
          border-radius: 16px;
          margin: 12px 0 28px;
        }
        .grid {
          display: grid;
          gap: 12px;
          max-width: 640px;
          margin: 0 auto;
          text-align: left;
        }
        .row {
          background: #1c1c1c;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 1rem;
        }
        .label { color: #9ca3af; }
        .value { color: #fff; font-weight: 700; }
        .hint {
          margin-top: 28px;
          color: #9ca3af;
          font-size: 1rem;
        }
      </style>
    </head>
    <body>
      <h1>✅ Request landed here</h1>
      <div class="badge">${instance}:${listenPort}</div>
      <div class="grid">
        <div class="row"><span class="label">Backend instance</span><span class="value">${instance}</span></div>
        <div class="row"><span class="label">Container hostname</span><span class="value">${hostname}</span></div>
        <div class="row"><span class="label">App listen port</span><span class="value">${listenPort}</span></div>
        <div class="row"><span class="label">Public URL</span><span class="value">${publicHost}</span></div>
        <div class="row"><span class="label">Current time</span><span class="value">${currentTime}</span></div>
      </div>
      <p class="hint">Hit this endpoint to confirm which backend instance answered.</p>
    </body>
    </html>
  `);
});

//global error handle
app.use(globalErrorHandler);

// handle not found route
app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
