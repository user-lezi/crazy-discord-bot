import { Client } from "discord.js";
import consola from "consola";

export function setupErrorHandler(client: Client) {
  process.on("unhandledRejection", (reason, promise) => {
    consola.fatal("Unhandled Promise Rejection");
    consola.error("Promise:", promise);
    consola.error(reason);
  });

  process.on("uncaughtExceptionMonitor", (error, origin) => {
    consola.warn(`Exception monitor (${origin})`);
    consola.error(error);
  });

  process.on("uncaughtException", (error, origin) => {
    consola.fatal(`Uncaught Exception (${origin})`);
    consola.error(error);

    // Give logs a chance to flush, then exit.
    setTimeout(() => process.exit(1), 100);
  });

  process.on("warning", (warning) => {
    consola.warn(`${warning.name}: ${warning.message}`);
  });

  client.on("error", (error) => {
    consola.error("Discord client error");
    consola.error(error);
  });

  client.on("shardError", (error, shardId) => {
    consola.error(`Shard ${shardId} websocket error`);
    consola.error(error);
  });

  client.on("shardDisconnect", (event, shardId) => {
    consola.warn(
      `Shard ${shardId} disconnected (code ${event.code}, clean=${event.wasClean})`,
    );
  });

  client.on("shardReconnecting", (shardId) => {
    consola.info(`Shard ${shardId} reconnecting...`);
  });

  client.on("shardResume", (shardId, replayedEvents) => {
    consola.success(
      `Shard ${shardId} resumed (${replayedEvents} replayed events)`,
    );
  });

  consola.success("Error handler initialized.");
}
