import { Client, REST, Routes } from "discord.js";

import consola from "consola";
import devtool from "../commands/devtool";
import image from "../commands/image";
import interactionCreate from "../events/interactionCreate";
import raw from "../commands/raw";
import ready from "../events/ready";
import { secrets } from "../config";
import tree from "../commands/tree";

export function loadEvents(client: Client) {
  const events = [ready, interactionCreate];

  consola.start("Loading events...");

  for (const event of events) {
    if (event.once) {
      client.once(event.name, event.execute as any);
    } else {
      client.on(event.name, event.execute as any);
    }

    client.events.set(event.customName ?? event.name, event);
  }

  consola.success(
    `Loaded ${events.length} event${events.length === 1 ? "" : "s"}.`,
  );
}

export async function loadCommands(client: Client) {
  const commands = [devtool, tree, image, raw];

  consola.start("Loading commands...");

  for (const command of commands) {
    client.commands.set(client.commands.size, command);
  }

  consola.success(
    `Loaded ${commands.length} command${commands.length === 1 ? "" : "s"}.`,
  );

  if (!secrets.token || !secrets.clientId) {
    consola.warn(
      "BotToken or BotID is missing. Skipping slash command registration.",
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(secrets.token);

  try {
    consola.start("Registering application commands...");

    const data = (await rest.put(Routes.applicationCommands(secrets.clientId), {
      body: commands.map((c) => c.data.toJSON()),
    })) as unknown[];

    consola.success(`Registered ${data.length} application command(s).`);
  } catch (error) {
    consola.error("Failed to register application commands.");
    consola.error(error);
  }
}
