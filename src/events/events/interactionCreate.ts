import {
  ReadyMadeReplies,
  interactionReply,
} from "../../util/interactionReply";

import { Users } from "../../users";
import { checkUserType } from "../../core/functions/checkUserType";
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
                if (Array.isArray(el)) {
                  return checkUserType(interaction, el, "all");
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

        // check if on cooldown.
        if (
          (command.data.cooldown && command.data.cooldown > 0) ||
          (command.data.guildCooldown && command.data.guildCooldown > 0)
        ) {
          let bypassCooldown = false;
          if (command.data.bypassCooldown) {
            bypassCooldown = (
              await Promise.all(
                command.data.bypassCooldown.map(async (el) => {
                  if (Array.isArray(el)) {
                    return checkUserType(interaction, el, "all");
                  } else if (typeof el == "string") {
                    return el == interaction.user.id;
                  } else if (typeof el == "function") {
                    return await el.bind(client)(interaction);
                  }
                  return false;
                }),
              )
            ).some(Boolean);
          }

          if (!bypassCooldown) {
            const commandName = command.data.builder.name;
            const cooldowns: Array<{ key: string; duration: number }> = [];

            if (command.data.cooldown && command.data.cooldown > 0) {
              cooldowns.push({
                key: `${interaction.user.id}-${commandName}`,
                duration: command.data.cooldown,
              });
            }

            if (command.data.guildCooldown && command.data.guildCooldown > 0) {
              if (!interaction.guildId) {
                return await interactionReply(interaction, {
                  content: "This command can only be used in a server.",
                });
              }

              cooldowns.push({
                key: `guild-${interaction.guildId}-${commandName}`,
                duration: command.data.guildCooldown,
              });
            }

            for (const { key } of cooldowns) {
              const cooldownEntry = client.cooldownManager.get(key);
              if (!cooldownEntry) continue;

              const remaining = Math.max(
                0,
                Math.ceil((cooldownEntry.expiresAt - Date.now()) / 1000),
              );
              if (remaining <= 0) continue;

              let stillOnCooldown = true;
              if (command.oncooldown) {
                const results = await command.oncooldown.bind(client)({
                  interaction,
                  reply: interactionReply,
                  command,
                  remaining,
                });

                if (typeof results === "boolean") {
                  stillOnCooldown = results;
                } else return;
              }

              if (stillOnCooldown)
                return await interactionReply(interaction, {
                  content: `This command is on cooldown. Please wait ${remaining} seconds.`,
                });
            }

            const now = Date.now();
            for (const { key, duration } of cooldowns) {
              client.cooldownManager.set(key, {
                remaining: duration,
                expiresAt: now + duration,
                userId: interaction.user.id,
                commandName,
              });
            }
          }
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
