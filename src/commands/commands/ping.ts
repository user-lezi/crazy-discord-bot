import { CreateCommand } from "../create";
import { SlashCommandBuilder } from "discord.js";

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("pong!")
      .setContexts(0, 1, 2)
      .setIntegrationTypes(1),
  },
  async execute(ctx) {
    let ping = this.ws.ping;
    ctx.reply(ctx.interaction, {
      content: `pong! ${-1 == ping ? 6969 : ping}ms`,
    });
  },
});
