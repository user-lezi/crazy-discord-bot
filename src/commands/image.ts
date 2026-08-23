import { CommandType, createCommandData } from "../handlers/commands";

import { ReadyMadeReplies } from "../util/interactionReply";
import { SlashCommandBuilder } from "discord.js";
import { guildIconImageCommand } from "./__internals__/image/guildIconCommand";
import { morphImageCommand } from "./__internals__/image/morphCommand";

export default createCommandData({
  type: CommandType.ChatInput,
  data: new SlashCommandBuilder()
    .setName("image")
    .setDescription("Crazy images")
    .addSubcommand((sub) =>
      sub
        .setName("guild_icon")
        .setDescription("Guild icon wow")
        .addBooleanOption((opt) =>
          opt
            .setName("allow_bots")
            .setDescription(
              "Allow bots to be included in the image (default: no)",
            )
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName("size")
            .setDescription(
              "Output resolution — bigger is slower to render (default: medium)",
            )
            .setRequired(false)
            .addChoices(
              { name: "Tiny (faster)", value: "tiny" },
              { name: "Small (fast)", value: "small" },
              { name: "Medium (default)", value: "medium" },
              { name: "Large (slow)", value: "large" },
            ),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("unique_only")
            .setDescription(
              "Never reuse a member's avatar twice — shrinks the grid instead of duplicating (default: no)",
            )
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("max_duplicates")
            .setDescription(
              "Max times a single member's avatar can repeat when filling the grid (default: no limit)",
            )
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("multiplier")
            .setDescription(
              "Repeat every member's avatar, e.g. 2 = everyone appears twice (default: 1)",
            )
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50),
        )
        .addAttachmentOption((opt) =>
          opt
            .setName("image")
            .setDescription("Recreate this image instead of the guild icon")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("morph")
        .setDescription("Morphs users")
        .addUserOption((opt) => opt.setName("from").setDescription("User 1"))
        .addUserOption((opt) => opt.setName("to").setDescription("User 2"))
        .addBooleanOption((opt) => opt.setName("loop").setDescription("Loop the GIF (default: no)")),
    ),
  async execute(interaction) {
    try {
      switch (interaction.options.getSubcommand()) {
        case "guild_icon":
          return guildIconImageCommand(interaction);
        case "morph":
          return morphImageCommand(interaction);
        default:
          throw new Error("Unknown subcommand.");
      }
    } catch (error) {
      return ReadyMadeReplies.unknownError(
        interaction,
        error,
        interaction.replied,
      );
    }
  },
});
