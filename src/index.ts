import { Client, Collection, GatewayIntentBits } from "discord.js";
import { loadCommands, loadEvents } from "./handlers";

import { ClientEventData } from "./handlers/events";
import { CommandData } from "./handlers/commands";
import { Client as Selfbot } from "discord.js-selfbot-v13";
import consola from "consola";
import { initSelf } from "./self";
import ora from "ora";
import { secrets } from "./config";
import { setupErrorHandler } from "./handlers/errorHandler";

declare module "discord.js" {
  interface Client {
    commands: Collection<number, CommandData>;
    events: Collection<string, ClientEventData<any>>;
    self?: Selfbot<true>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();
client.events = new Collection();
if (secrets.userToken) client.self = new Selfbot({});

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

    if (client.self && secrets.userToken) {
      spinner.start("Initializing Discord User...");
      await initSelf(client.self);
      spinner.succeed("Discord User Ready");
      spinner.start("Logging into Discord User...");
      await client.self.login(secrets.userToken);
      spinner.succeed("Connected to Discord User");
    }
  } catch (error) {
    consola.error(error);
    process.exit(1);
  }
}

start();
