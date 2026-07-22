import type { BaseInteraction, Client } from "discord.js";

import { ReadyMadeReplies } from "../util/interactionReply";
import { createEventData } from "../handlers/events";

export default createEventData({
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    let { client } = interaction;
    if (interaction.isChatInputCommand()) {
      const command = client.commands.find(
        (cmd) => cmd.data.name == interaction.commandName,
      );

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error: any) {
        console.error(`Error executing ${interaction.commandName}`);
        try {
          ReadyMadeReplies.unknownError(interaction, error);
        } catch {}
      }
    }

    if (interaction.isAutocomplete()) {
      const command = client.commands.find(
        (cmd) => cmd.data.name == interaction.commandName,
      );

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        if (command.autocomplete) await command.autocomplete(interaction);
        else
          interaction.respond([
            {
              name: "This option do not have autocomplete feature.",
              value: "error",
            },
          ]);
      } catch (error: any) {
        console.error(`Error executing ${interaction.commandName}`);
      }
    }
  },
});
