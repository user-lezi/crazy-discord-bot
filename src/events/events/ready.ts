import { pick, shuffle } from "../../util/random";

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

    // revoling status messages
    let statusMessages: (() => null | (Promise<string> | string))[] = [
      // bot related
      () => `Serving ${client.guilds.cache.size} guilds`,
      () =>
        `watching ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users`,
      // fun
      () => `Type /help for commands`,
      () => {
        let randomGuild = pick(client.guilds.cache.map((guild) => guild.name));
        return pick([
          `is ${randomGuild} tuff?`,
          `is ${randomGuild} cool?`,
          `${randomGuild} is the best guild!`,
        ]);
      },
      () => {
        let randomUser = pick(client.users.cache.map((user) => user.username));
        return pick([
          `is ${randomUser} tuff?`,
          `is ${randomUser} cool?`,
          `${randomUser} is the best user!`,
        ]);
      },

      // random
      () => `is the sky blue?`,
      () => `is the grass green?`,
      () => `is water wet?`,
      () => `is fire hot?`,
      () => `is ice cold?`,
      () => `is the sun bright?`,
      () => `is the moon shiny?`,
      () => `is the earth round?`,
      () => `is the universe infinite?`,

      // misc
      () => {
        let chance = 1 / statusMessages.length;
        return `this status has ${(chance * 100).toFixed(2)}% chance of being shown`;
      },
    ];
    const randomBullshitMessages: string[] = ["whats up?", "i have feelings."];

    let currentStatusIndex = 0;
    let interval = setInterval(async () => {
      if (currentStatusIndex == 0) statusMessages = shuffle(statusMessages);
      let statusMessage = await statusMessages[currentStatusIndex]();
      statusMessage ??= pick(randomBullshitMessages);

      if (statusMessage.length > 128)
        statusMessage = pick(randomBullshitMessages);

      client.user.setActivity({
        name: statusMessage,
        type: 4,
      });

      currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
    }, 15000);
  },
});
