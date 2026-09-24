import { createEventData } from "../create";

export default createEventData({
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(
      `Logged in as ${client.user.tag}\n` +
        `${client.guilds.cache.size} guilds\n` +
        `${client.commandManager.size} commands`,
    );
  },
});
