import { CreateCommand } from "../../create";
import { SlashCommandBuilder } from "discord.js";
import { createCourtGame } from "../../../core/commands/ai/court/gameInstance";

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("court")
      .setDescription("Answer, vote, and survive the AI Court.")
      .setContexts(0)
      .setIntegrationTypes(0),
    guildCooldown: 30_000,
  },
  async execute({ interaction }) {
    await createCourtGame(interaction.client, interaction);
  },
});
