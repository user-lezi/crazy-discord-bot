import { readdirSync } from "node:fs";
import { join } from "node:path";
import { GlobalFonts } from "@napi-rs/canvas";
import { Client, GatewayIntentBits } from "discord.js";

import { CacheManager } from "./managers/CacheManager";
import { CommandManager } from "./managers/CommandManager";
import { EventManager } from "./managers/EventManager";
import type { Image } from "@napi-rs/canvas";
import { OllamaService } from "./core/functions/ollama";
import { config } from "dotenv";
import { setupErrorHandler } from "./events/error";

declare module "discord.js" {
  interface Client {
    commandManager: CommandManager;
    eventManager: EventManager;
    cacheManager: CacheManager<unknown>;
    cooldownManager: CacheManager<{
      remaining: number;
      expiresAt: number;
      userId: string;
      commandName: string;
    }>;
    imageCacheManager: CacheManager<Image>;
    ollama: typeof OllamaService;
  }
}

config({ quiet: true });

function registerFonts(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      registerFonts(path);
    } else if (entry.isFile() && /\.(ttf|otf)$/i.test(entry.name)) {
      if (!GlobalFonts.registerFromPath(path)) {
        throw new Error(`Failed to register font: ${path}`);
      }
    }
  }
}

const existingFontFamilies = new Set(
  GlobalFonts.families.map((font) => font.family),
);
registerFonts(join(process.cwd(), "assets", "fonts"));
const registeredFonts = GlobalFonts.families
  .map((font) => font.family)
  .filter((family) => !existingFontFamilies.has(family))
  .sort((a, b) => a.localeCompare(b));
console.info(
  `Loaded custom fonts (${registeredFonts.length} families):\n${registeredFonts
    .map((font) => `  - ${font}`)
    .join("\n")}`,
);

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
client.imageCacheManager = new CacheManager();
client.ollama = OllamaService;

setupErrorHandler(client);

async function start() {
  try {
    client.eventManager.load();
    await client.commandManager.load();

    client.login(process.env.BotToken);
  } catch (error) {
    console.error("Failed to start bot.", error);
    process.exit(1);
  }
}

start();
