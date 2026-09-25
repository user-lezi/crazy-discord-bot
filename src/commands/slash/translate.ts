import {
  ContainerBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";

import { CreateCommand } from "../create";
import { Languages } from "../../core/apis/constants";
import { VgjrAPI } from "../../core/apis/vgjr";

function flagFor(nameOrCode: string): string {
  const match = Languages.find(
    (l) =>
      l.code.toLowerCase() === nameOrCode.toLowerCase() ||
      l.name.toLowerCase() === nameOrCode.toLowerCase(),
  );
  return match?.country.emoji ?? "🌐";
}

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("translate")
      .setDescription("understand.")
      .addStringOption((opt) =>
        opt
          .setRequired(true)
          .setName("text")
          .setDescription("what to translate"),
      )
      .addBooleanOption((opt) =>
        opt.setName("ephemeral").setDescription("private?"),
      )
      .setContexts(0, 1, 2)
      .setIntegrationTypes(0, 1),
  },
  async execute(ctx) {
    let text = ctx.interaction.options.getString("text", true);
    let ephemeral = ctx.interaction.options.getBoolean("ephemeral") ?? false;
    try {
      let result = await VgjrAPI.Translate(text);
      let translation = result.response;
      let from = result.data.fromLang[1] ?? "Auto-detected";
      let to = result.data.toLang[1] ?? "Unknown";

      const fromFlag = flagFor(from);
      const toFlag = flagFor(to);

      await ctx.reply(ctx.interaction, {
        components: [
          new ContainerBuilder()
            .setAccentColor(0x5865f2)
            .addTextDisplayComponents((text) =>
              text.setContent(String(translation)),
            )
            .addSeparatorComponents((sep) => sep.setDivider(true).setSpacing(1))
            .addTextDisplayComponents((text) =>
              text.setContent(`-# ${fromFlag} ${from} → ${toFlag} ${to}`),
            ),
        ],
        flags: ephemeral ? 64 | 32768 : 32768,
      });
    } catch (error) {
      console.error(error);
      await ctx.reply(ctx.interaction, {
        components: [
          new ContainerBuilder()
            .setAccentColor(0xed4245)
            .addTextDisplayComponents((text) =>
              text.setContent(
                "### ⚠️ Error\nSomething went wrong while translating.",
              ),
            ),
        ],
        flags: 64 | 32768,
      });
    }
  },
});
