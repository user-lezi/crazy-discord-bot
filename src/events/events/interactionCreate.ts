import {
  ReadyMadeReplies,
  interactionReply,
} from "../../util/interactionReply";

import { Users } from "../../users";
import { createEventData } from "../create";

export default createEventData({
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    let { client } = interaction;
    if (
      interaction.isChatInputCommand() ||
      interaction.isContextMenuCommand()
    ) {
      const command = client.commandManager.commands.find(
        (cmd) => cmd.data.builder.name == interaction.commandName,
      );

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        // check if restricted.
        if (command.data.restrictTo) {
          const allowed = (
            await Promise.all(
              command.data.restrictTo.map(async (el) => {
                if (el == "developers") {
                  return Users.some(
                    (u) =>
                      String(typeof u === "string" ? u : u?.id) ===
                        interaction.user.id && u.type == "developer",
                  );
                } else if (typeof el == "string") {
                  return el == interaction.user.id;
                } else if (typeof el == "function") {
                  return await el.bind(client)(interaction);
                }
                return false;
              }),
            )
          ).some(Boolean);

          if (!allowed)
            return await interactionReply(interaction, {
              content: "You are not allowed.",
            });
        }

        if (command.preexecute)
          await command.preexecute.bind(this)({
            command,
            interaction,
            reply: interactionReply,
          });
        await command.execute.bind(this)({
          command,
          interaction,
          reply: interactionReply,
        });
        if (command.postexecute)
          await command.postexecute.bind(this)({
            command,
            interaction,
            reply: interactionReply,
          });
      } catch (error: any) {
        console.error(`Error executing ${interaction.commandName}`);
        try {
          ReadyMadeReplies.unknownError(interaction, error);
        } catch {}
      }
    }

    if (interaction.isAutocomplete()) {
      const command = client.commandManager.commands.find(
        (cmd) => cmd.data.builder.name == interaction.commandName,
      );

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        if (command.autocomplete)
          await command.autocomplete.bind(client)(interaction);
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
