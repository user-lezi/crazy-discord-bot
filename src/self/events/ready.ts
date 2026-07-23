import consola from "consola";
import { createEventData } from "../handlers/events";

export default createEventData({
  name: "ready",
  once: true,
  execute(client) {
    consola.box(
      `Logged in as ${client.user.tag}\n` +
        `${client.guilds.cache.size} guilds`,
    );
  },
});
