import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

import { CreateCommand } from "../create";
import { createShipResult } from "../../core/commands/ai/ship";

const loadingMessages = [
  "🧮 Calculating the name-vibe compatibility between **{first}** and **{second}**…",
  "💞 Comparing **{first}** and **{second}** and finding their shared spark…",
  "✨ Dreaming up a ship name for **{first}** + **{second}**…",
  "🔎 Looking for the perfect blend of **{first}** and **{second}**…",
];

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("ship")
      .setDescription("See how compatible two users are.")
      .addUserOption((option) =>
        option
          .setName("user1")
          .setDescription("The first user")
          .setRequired(true),
      )
      .addUserOption((option) =>
        option
          .setName("user2")
          .setDescription("The second user")
          .setRequired(true),
      )
      .setContexts(0, 1, 2)
      .setIntegrationTypes(0, 1),
    cooldown: 10_000,
  },
  async execute({ interaction, reply }) {
    const first = interaction.options.getUser("user1", true);
    const second = interaction.options.getUser("user2", true);

    if (first.id === second.id) {
      await reply(interaction, {
        content: "You cannot ship a user with themselves.",
        flags: 64,
      });
      return;
    }

    const firstName = first.globalName ?? first.username;
    const secondName = second.globalName ?? second.username;
    const formatLoadingMessage = (index: number) =>
      loadingMessages[index % loadingMessages.length]
        .replace("{first}", firstName)
        .replace("{second}", secondName);

    await interaction.deferReply();
    await interaction.editReply({ content: formatLoadingMessage(0) });

    let loadingIndex = 1;
    let updatePromise: Promise<void> | undefined;
    const loadingTimer = setInterval(() => {
      if (updatePromise) return;

      updatePromise = interaction
        .editReply({ content: formatLoadingMessage(loadingIndex++) })
        .then(() => {})
        .catch((error: unknown) => {
          console.error("Failed to update /ship loading message.", error);
        })
        .finally(() => {
          updatePromise = undefined;
        });
    }, 2500);

    let result: Awaited<ReturnType<typeof createShipResult>>;
    try {
      result = await createShipResult(interaction.client, first, second);
    } finally {
      clearInterval(loadingTimer);
      await updatePromise;
    }

    const attachment = new AttachmentBuilder(result.image, {
      name: "ship.png",
    });
    const embed = new EmbedBuilder()
      .setColor(0xeb6fa5)
      .setTitle(`${result.emojis.join("")} ${result.name}`.trim())
      .setDescription(
        [`**${result.score}% compatibility**`, result.opinion].join("\n\n"),
      )
      .setImage("attachment://ship.png")
      .setFooter({
        text: "Compatibility is estimated from name embeddings, just for fun.",
      });

    await reply(interaction, {
      content: "",
      embeds: [embed],
      files: [attachment],
    });
  },
});
