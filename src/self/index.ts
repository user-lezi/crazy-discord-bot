import { Client } from "discord.js-selfbot-v13";
import { loadEvents } from "./handlers";

export function initSelf(client: Client) {
  loadEvents(client);
}
