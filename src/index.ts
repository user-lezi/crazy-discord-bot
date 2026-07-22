import { Client, Collection, GatewayIntentBits } from "discord.js";
import { loadCommands, loadEvents } from "./handlers";

import { ClientEventData } from "./handlers/events";
import { CommandData } from "./handlers/commands";
import consola from "consola";
import ora from "ora";
import { secrets } from "./config";
import { setupErrorHandler } from "./handlers/errorHandler";

declare module "discord.js" {
  interface Client {
    commands: Collection<number, CommandData>;
    events: Collection<string, ClientEventData<any>>;
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();
client.events = new Collection();

setupErrorHandler(client);

async function start() {
  try {
    secrets.validate();

    const spinner = ora("Loading events...").start();
    loadEvents(client);
    spinner.succeed(`Loaded ${client.events.size} events`);

    spinner.start("Loading commands...");
    await loadCommands(client);
    spinner.succeed(`Loaded ${client.commands.size} commands`);

    if (!secrets.token) {
      consola.fatal("BotToken is missing in the environment variables.");
      process.exit(1);
    }

    spinner.start("Logging into Discord...");
    await client.login(secrets.token);
    spinner.succeed("Connected to Discord");
  } catch (error) {
    consola.error(error);
    process.exit(1);
  }
}

start();
