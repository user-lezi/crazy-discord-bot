import { Client } from "discord.js";

export function setupErrorHandler(client: Client) {
  process.on("unhandledRejection", (reason, promise) => {
    console.warn("Unhandled Promise Rejection");
    console.error("Promise:", promise);
    console.error(reason);
  });

  process.on("uncaughtExceptionMonitor", (error, origin) => {
    console.warn(`Exception monitor (${origin})`);
    console.error(error);
  });

  process.on("uncaughtException", (error, origin) => {
    console.warn(`Uncaught Exception (${origin})`);
    console.error(error);

    // Give logs a chance to flush, then exit.
    setTimeout(() => process.exit(1), 100);
  });

  process.on("warning", (warning) => {
    console.warn(`${warning.name}: ${warning.message}`);
  });

  client.on("error", (error) => {
    console.error("Discord client error");
    console.error(error);
  });

  client.on("shardError", (error, shardId) => {
    console.error(`Shard ${shardId} websocket error`);
    console.error(error);
  });

  client.on("shardDisconnect", (event, shardId) => {
    console.warn(
      `Shard ${shardId} disconnected (code ${event.code}, clean=${event.wasClean})`,
    );
  });

  client.on("shardReconnecting", (shardId) => {
    console.info(`Shard ${shardId} reconnecting...`);
  });

  client.on("shardResume", (shardId, replayedEvents) => {
    console.log(`Shard ${shardId} resumed (${replayedEvents} replayed events)`);
  });

  console.log("Error handler initialized.");
}
