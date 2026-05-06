import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDB();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  // Graceful shutdown — without this, `node --watch` (and other process
  // managers) send SIGTERM, the process dies before the listening socket is
  // closed cleanly, and the kernel keeps the port reserved long enough that
  // the next restart fails with EADDRINUSE.
  let shuttingDown = false;
  const shutdown = (signal) => () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received, closing server…`);
    // Stop accepting new connections; let in-flight requests finish.
    server.close((err) => {
      if (err) {
        console.error("Error during server close:", err);
        process.exit(1);
      }
      process.exit(0);
    });
    // Hard limit so a hung connection can't block restarts forever.
    setTimeout(() => {
      console.warn("Forced exit after 5s shutdown timeout");
      process.exit(1);
    }, 5000).unref();
  };

  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
