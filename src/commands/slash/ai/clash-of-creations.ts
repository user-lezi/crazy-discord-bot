import { CreateCommand } from "../../create";
import { SlashCommandBuilder } from "discord.js";
import { createGameInstance } from "../../../core/commands/ai/clash-of-creations";

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("clash-of-creations")
      .setDescription("Compete against other user's creations.")
      .setContexts(0)
      .setIntegrationTypes(0),
  },
  async execute(ctx) {
    await createGameInstance(ctx.interaction.client, ctx.interaction);
  },
});
