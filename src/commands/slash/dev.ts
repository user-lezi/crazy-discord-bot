import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

import { CreateCommand } from "../create";
import { ReadyMadeReplies } from "../../util/interactionReply";
import { inspect } from "node:util";

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("dev")
      .setDescription("Developer only.")
      .setIntegrationTypes(1)
      .addStringOption((opt) =>
        opt
          .setName("code")
          .setDescription("Code to evaluate")
          .setRequired(true),
      ),
    restrictTo: ["developer"],
  },
  async execute(ctx) {
    let { interaction } = ctx;
    try {
      evalCommand(interaction);
    } catch (error) {
      return ReadyMadeReplies.unknownError(
        interaction,
        error,
        interaction.replied,
      );
    }
  },
});
async function evalCommand(interaction: ChatInputCommandInteraction) {
  const code = interaction.options.getString("code", true);

  const start = performance.now();

  try {
    const result = await interaction.client["_eval"](
      `(async () => { ${code} })()`,
    );

    const time = performance.now() - start;

    let output = inspect(result, {
      depth: null,
      colors: false,
      compact: false,
      breakLength: 100,
    });

    output = redactSecrets(output);

    const pages = chunk(output || "undefined", 4000);

    await paginate(interaction, pages, "Eval Result", 0xeffe02, time);
  } catch (error) {
    const time = performance.now() - start;

    let output =
      error instanceof Error ? (error.stack ?? error.message) : String(error);

    output = redactSecrets(output);

    await paginate(
      interaction,
      chunk(output, 4000),
      "Eval Error",
      0xeffe02,
      time,
    );
  }
}

async function paginate(
  interaction: ChatInputCommandInteraction,
  pages: string[],
  title: string,
  color: number,
  time: number,
) {
  let page = 0;

  const createPage = () => ({
    embeds: [
      new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(`\`\`\`js\n${pages[page]}\n\`\`\``)
        .setFooter({
          text: `Page ${page + 1}/${pages.length} • ${time.toFixed(2)}ms`,
        }),
    ],

    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Previous")
          .setStyle(1)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(1)
          .setDisabled(page === pages.length - 1),
      ),
    ],

    allowedMentions: {
      parse: [],
    },
  });

  const message = await interaction.reply(createPage());

  const collector = message.createMessageComponentCollector({
    time: 300_000,
  });

  collector.on("collect", async (button) => {
    if (button.user.id !== interaction.user.id) {
      return button.reply({
        content: "❌ This is not your eval.",
        flags: 64,
      });
    }

    if (button.customId === "next") {
      page++;
    }

    if (button.customId === "previous") {
      page--;
    }

    page = Math.max(0, Math.min(page, pages.length - 1));

    await button.update(createPage());
  });

  collector.on("end", () => {
    interaction
      .editReply({
        components: [],
      })
      .catch(() => {});
  });
}

function chunk(text: string, size: number) {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }

  return chunks;
}

function redactSecrets(text: string) {
  const secrets = [
    [
      process.env.BotToken,
      "NEV3Rg0nnaGiveYouUPNEv3rgoNNA.letYoudownor_desertYou111",
    ],
    [process.cwd(), "C:\\dih"],
  ].filter((x) => !!x[0]);

  for (const secret of secrets) {
    text = text.replaceAll(secret[0]!, secret[1] ?? "[REDACTED]");
  }

  return text;
}
