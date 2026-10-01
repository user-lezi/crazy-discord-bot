import { Client, Collection, GatewayIntentBits } from "discord.js";

import { CacheManager } from "./managers/CacheManager";
import { CommandManager } from "./managers/CommandManager";
import { EventManager } from "./managers/EventManager";
import { OllamaService } from "./core/functions/ollama";
import { config } from "dotenv";
import { setupErrorHandler } from "./events/error";

declare module "discord.js" {
  interface Client {
    commandManager: CommandManager;
    eventManager: EventManager;
    cacheManager: CacheManager<unknown>;
    cooldownManager: CacheManager<{ remaining: number; expiresAt: number, userId: string, commandName: string }>;
    ollama: typeof OllamaService;
  }
}

config({ quiet: true });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commandManager = new CommandManager(client);
client.eventManager = new EventManager(client);
client.cacheManager = new CacheManager();
client.cooldownManager = new CacheManager();
client.ollama = OllamaService;

setupErrorHandler(client);

async function start() {
  try {
    client.eventManager.load();
    await client.commandManager.load();

    client.login(process.env.BotToken);
  } catch (error) {
    process.exit(1);
  }
}

start();
