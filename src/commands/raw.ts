import {
  ApplicationIntegrationType,
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { CommandType, createCommandData } from "../handlers/commands";

import { ReadyMadeReplies } from "../util/interactionReply";
import { User } from "discord.js-selfbot-v13";

export default createCommandData({
  type: CommandType.ChatInput,

  data: new SlashCommandBuilder()
    .setName("raw")
    .setDescription("Raw Output.")
    .setIntegrationTypes([ApplicationIntegrationType.UserInstall])
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Raw User JSON.")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to get raw json data"),
        )
        .addBooleanOption((opt) =>
          opt.setName("as_file").setDescription("Output in a file?"),
        ),
    ),

  async execute(interaction) {
    try {
      switch (interaction.options.getSubcommand()) {
        case "user":
          return userRawCommand(interaction);
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

// Leaves headroom for the ```json / ``` fences plus Discord's 2000-char
// message cap — safer than cutting it exactly at 2000.
const INLINE_JSON_LIMIT = 1900;

async function userRawCommand(interaction: ChatInputCommandInteraction) {
  // Defaults to the invoking user if none was given — this command works
  // in DMs / no-guild contexts too, since it's user-installed.
  const targetUser = interaction.options.getUser("user") ?? interaction.user;
  const asFile = interaction.options.getBoolean("as_file") ?? false;

  await interaction.deferReply({ ephemeral: true });

  // Re-fetch so we get the full public profile (banner, accent color,
  // etc.) instead of whatever partial data happened to already be cached.
  let user: User;
  try {
    user = await targetUser
      .fetch()
      .then((u) => interaction.client.self!.users.fetch(u.id));
  } catch {
    user = await interaction.client.self!.users.fetch(targetUser.id); // fetch failing isn't fatal — just use what we have
  }

  const profile = await user.getProfile();
  for (const key of Object.keys(profile)) {
    if (key.startsWith("mutual_")) {
      delete (profile as Record<string, unknown>)[key];
    }
  }

  const json = JSON.stringify(profile, null, 2);

  if (asFile || json.length > INLINE_JSON_LIMIT) {
    const attachment = new AttachmentBuilder(Buffer.from(json, "utf-8"), {
      name: `${user.id}.json`,
    });
    await interaction.editReply({
      content:
        !asFile && json.length > INLINE_JSON_LIMIT
          ? "That was too long to send inline, so here's a file instead:"
          : undefined,
      files: [attachment],
    });
    return;
  }

  await interaction.editReply({
    content: `\`\`\`json\n${json}\n\`\`\``,
  });
}
