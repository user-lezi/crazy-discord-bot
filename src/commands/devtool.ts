import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { CommandType, createCommandData } from "../handlers/commands";
import { constants, users } from "../config";
import { formatBytes, formatTime } from "../util/formatters";

import { ReadyMadeReplies } from "../util/interactionReply";
import { exec } from "node:child_process";
import { inspect } from "node:util";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";
import { statSync } from "node:fs";

const execAsync = promisify(exec);

export default createCommandData({
  type: CommandType.ChatInput,

  data: new SlashCommandBuilder()
    .setName("devtool")
    .setDescription("Developer only.")
    .setIntegrationTypes([ApplicationIntegrationType.UserInstall])

    .addSubcommand((sub) =>
      sub
        .setName("eval")
        .setDescription("Evaluate JavaScript code.")
        .addStringOption((opt) =>
          opt
            .setName("code")
            .setDescription("Code to evaluate.")
            .setRequired(true),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName("exec")
        .setDescription("Execute a shell command.")
        .addStringOption((opt) =>
          opt
            .setName("command")
            .setDescription("Shell command.")
            .setRequired(true),
        ),
    )

    .addSubcommand((sub) =>
      sub.setName("stats").setDescription("Show bot statistics."),
    ),

  async execute(interaction) {
    if (!users.isDeveloper(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You are not allowed to use this command.",
        ephemeral: true,
      });
    }

    try {
      switch (interaction.options.getSubcommand()) {
        case "eval":
          return evalCommand(interaction);

        case "exec":
          return execCommand(interaction);

        case "stats":
          return statsCommand(interaction);

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
async function execCommand(interaction: ChatInputCommandInteraction) {
  const command = interaction.options.getString("command", true);

  const start = performance.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: constants.limits.evalTimeout,
      maxBuffer: 1024 * 1024,
    });

    const output = stdout || stderr || "No output.";

    await paginate(
      interaction,
      chunk(redactSecrets(output), 4000),
      "Exec Result",
      stderr ? constants.colors.error : constants.colors.success,
      performance.now() - start,
    );
  } catch (error) {
    await paginate(
      interaction,
      chunk(error instanceof Error ? error.message : String(error), 4000),
      "Exec Error",
      constants.colors.error,
      performance.now() - start,
    );
  }
}
async function statsCommand(interaction: ChatInputCommandInteraction) {
  const client = interaction.client;

  const uptime = Math.floor(client.uptime / 1000);

  const memory = process.memoryUsage();
  const botSize = statSync(path.resolve(process.cwd(), "bot.js")).size;

  const embed = new EmbedBuilder()
    .setColor(constants.colors.info)
    .setTitle("Bot Statistics")
    .addFields(
      {
        name: "Discord",
        value: [
          `🏠 Guilds: ${client.guilds.cache.size}`,
          `👥 Users: ${client.users.cache.size}`,
          `📡 Ping: ${client.ws.ping}ms`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Process",
        value: [
          `⏱️ Uptime: ${formatTime(uptime)}`,
          `💾 RAM: ${formatBytes(memory.rss)}`,
          `📦 Bundle: ${formatBytes(botSize)}`,
          `🟢 Node: ${process.version}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "System",
        value: [
          `🖥️ CPU: ${os.cpus()[0].model}`,
          `⚙️ Cores: ${os.cpus().length}`,
          `🌐 Platform: ${process.platform}`,
        ].join("\n"),
      },
    )
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
  });
}
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

    await paginate(
      interaction,
      pages,
      "Eval Result",
      constants.colors.info,
      time,
    );
  } catch (error) {
    const time = performance.now() - start;

    let output =
      error instanceof Error ? (error.stack ?? error.message) : String(error);

    output = redactSecrets(output);

    await paginate(
      interaction,
      chunk(output, 4000),
      "Eval Error",
      constants.colors.error,
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
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),

        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
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
        ephemeral: true,
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
  const secrets = [process.env.BotToken].filter(Boolean);

  for (const secret of secrets) {
    text = text.replaceAll(secret!, "[REDACTED]");
  }

  return text;
}
