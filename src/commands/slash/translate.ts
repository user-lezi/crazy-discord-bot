import {
  ContainerBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";

import { CreateCommand } from "../create";
import { Languages } from "../../core/apis/constants";
import { VgjrAPI } from "../../core/apis/vgjr";
import { pathToFileURL } from "node:url";

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
      .addStringOption((opt) =>
        opt.setName("from").setDescription("from what?").setAutocomplete(true),
      )
      .addStringOption((opt) =>
        opt.setName("to").setDescription("to what?").setAutocomplete(true),
      )
      .addBooleanOption((opt) =>
        opt.setName("ephemeral").setDescription("private?"),
      )
      .setContexts(0, 1, 2)
      .setIntegrationTypes(0, 1),
  },

  async autocomplete(interaction) {
    let opt = interaction.options.getFocused(true);
    if (opt.name === "from" || opt.name === "to") {
      const value = String(opt.value).toLowerCase().trim();
      const choices = Languages.filter(
        (language) =>
          language.name.toLowerCase().includes(value) ||
          language.code.toLowerCase().includes(value) ||
          language.country.name.toLowerCase().includes(value),
      )
        .slice(0, 25)
        .map((language) => ({
          name: `${language.country.emoji} ${language.name} (${language.code})`,
          value: language.code,
        }));

      await interaction.respond(choices);
    }
  },

  async execute(ctx) {
    let text = ctx.interaction.options.getString("text", true);
    let from = ctx.interaction.options.getString("from") ?? undefined;
    let to = ctx.interaction.options.getString("to") ?? undefined;

    let ephemeral = ctx.interaction.options.getBoolean("ephemeral") ?? false;

    ctx.interaction.deferReply({ flags: ephemeral ? 64 | 32768 : 32768 });
    try {
      let result = await VgjrAPI.Translate(text, from, to);
      let translation = result.response;
      let fromLang = result.data.fromLang[1] ?? "Auto-detected";
      let toLang = result.data.toLang[1] ?? "Unknown";

      const fromFlag = flagFor(fromLang);
      const toFlag = flagFor(toLang);

      await ctx.reply(ctx.interaction, {
        components: [
          new ContainerBuilder()
            .setAccentColor(0x5865f2)
            .addTextDisplayComponents((text) =>
              text.setContent(String(translation)),
            )
            .addSeparatorComponents((sep) => sep.setDivider(true).setSpacing(1))
            .addTextDisplayComponents((text) =>
              text.setContent(
                `-# ${fromFlag} ${fromLang} → ${toFlag} ${toLang}`,
              ),
            ),
        ],
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
