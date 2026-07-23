import { Client } from "discord.js-selfbot-v13";
import consola from "consola";
import ready from "../events/ready";

export function loadEvents(client: Client) {
  const events = [ready];

  consola.start("Loading events...");

  for (const event of events) {
    if (event.once) {
      client.once(event.name, event.execute as any);
    } else {
      client.on(event.name, event.execute as any);
    }
  }

  consola.success(
    `Loaded ${events.length} event${events.length === 1 ? "" : "s"}.`,
  );
}
