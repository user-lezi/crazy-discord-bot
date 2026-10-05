import {
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  User,
} from "discord.js";

import { CreateCommand } from "../create";
import { generateRizzUp } from "../../core/commands/ai/rizz-up";
import type { RizzUpInputUser } from "../../core/commands/ai/rizz-up";

const MESSAGE_SCAN_LIMIT = 100;
const CONTEXT_MESSAGE_LIMIT = 25;
const MAX_CONTEXT_MESSAGE_LENGTH = 500;
const TARGET_PICKER_TIMEOUT_MS = 60_000;

function displayName(user: User): string {
  return user.globalName ?? user.username;
}

function toRizzUpUser(user: User): RizzUpInputUser {
  return {
    name: displayName(user),
    id: user.id,
  };
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_~|>])/g, "\\$1");
}

export default CreateCommand({
  data: {
    builder: new SlashCommandBuilder()
      .setName("rizz-up")
      .setDescription("Get a natural, context-aware line to send someone.")
      .setContexts(0)
      .setIntegrationTypes(0),
    cooldown: 15_000,
  },
  async execute({ interaction }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let generated = false;
    try {
      const channel = interaction.channel;
      if (!channel?.isTextBased() || !("messages" in channel)) {
        await interaction.editReply(
          "I can only read recent messages in a text channel.",
        );
        return;
      }

      const fetchedMessages = await channel.messages.fetch({
        limit: MESSAGE_SCAN_LIMIT,
      });
      const scannedMessages = [...fetchedMessages.values()];
      const contextMessages = scannedMessages
        .filter(
          (message) => !message.author.bot && Boolean(message.content.trim()),
        )
        .slice(0, CONTEXT_MESSAGE_LIMIT)
        .reverse();

      if (contextMessages.length === 0) {
        await interaction.editReply(
          "I couldn't read any recent chat text. Check that I can view this channel and read its message history.",
        );
        return;
      }

      const candidates = new Map<string, User>();
      for (const message of contextMessages) {
        if (message.author.id !== interaction.user.id) {
          candidates.set(message.author.id, message.author);
        }
      }

      if (candidates.size === 0) {
        await interaction.editReply(
          "I couldn't find another person in the recent chat to rizz up.",
        );
        return;
      }

      let target: User;
      if (candidates.size === 1) {
        target = candidates.values().next().value!;
      } else {
        const options = [...candidates.values()].map((user) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(truncate(displayName(user), 100))
            .setDescription(truncate(`@${user.username}`, 100))
            .setValue(user.id),
        );
        const menu = new StringSelectMenuBuilder()
          .setCustomId(`rizz-up-target:${interaction.id}`)
          .setPlaceholder("Choose who to rizz up")
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(options);
        const row =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        await interaction.editReply({
          content: "Who should I help you rizz up?",
          components: [row],
        });
        const pickerMessage = await interaction.fetchReply();
        const collector = pickerMessage.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: TARGET_PICKER_TIMEOUT_MS,
        });

        const selectedTarget = await new Promise<User | null>(
          (resolve, reject) => {
            let settled = false;
            collector.on("collect", async (selection) => {
              if (selection.user.id !== interaction.user.id) {
                await selection.reply({
                  content: "Only the person who ran this command can choose.",
                  flags: MessageFlags.Ephemeral,
                });
                return;
              }

              const selectedUser = candidates.get(selection.values[0]);
              if (!selectedUser) {
                await selection.reply({
                  content:
                    "That user is no longer available. Run /rizz-up again.",
                  flags: MessageFlags.Ephemeral,
                });
                return;
              }

              settled = true;
              collector.stop("selected");
              try {
                await selection.deferUpdate();
                resolve(selectedUser);
              } catch (error) {
                reject(error);
              }
            });
            collector.once("end", (_collected, reason) => {
              if (!settled && reason === "time") resolve(null);
            });
          },
        );

        if (!selectedTarget) {
          await interaction.editReply({
            content: "No one was selected, so I cancelled the rizz-up.",
            components: [],
          });
          return;
        }
        target = selectedTarget;
      }

      await interaction.editReply({
        content: `Finding the right words for ${displayName(target)}…`,
        components: [],
      });

      const relevantMessages = scannedMessages
        .filter(
          (message) => !message.author.bot && Boolean(message.content.trim()),
        )
        .slice(0, CONTEXT_MESSAGE_LIMIT)
        .reverse()
        .map((message) => ({
          character:
            message.author.id === target.id
              ? ("target" as const)
              : message.author.id === interaction.user.id
                ? ("requester" as const)
                : ("side-character" as const),
          author: toRizzUpUser(message.author),
          content: truncate(message.content.trim(), MAX_CONTEXT_MESSAGE_LENGTH),
          timestamp: message.createdAt.toISOString(),
          replyTo: (() => {
            const referencedMessage = message.reference?.messageId
              ? fetchedMessages.get(message.reference.messageId)
              : undefined;
            if (
              !referencedMessage ||
              referencedMessage.author.bot ||
              !referencedMessage.content.trim()
            ) {
              return undefined;
            }

            return {
              character:
                referencedMessage.author.id === target.id
                  ? ("target" as const)
                  : referencedMessage.author.id === interaction.user.id
                    ? ("requester" as const)
                    : ("side-character" as const),
              author: toRizzUpUser(referencedMessage.author),
              content: truncate(
                referencedMessage.content.trim(),
                MAX_CONTEXT_MESSAGE_LENGTH,
              ),
            };
          })(),
        }));
      const targetMessages = relevantMessages.filter(
        (message) => message.character === "target",
      );
      if (targetMessages.length === 0) {
        await interaction.editReply(
          `I couldn't find recent messages from ${displayName(target)} to use as context.`,
        );
        return;
      }
      const targetMessage = targetMessages[targetMessages.length - 1].content
        .replace(/\s+/g, " ")
        .trim();
      const line = await generateRizzUp({
        requester: toRizzUpUser(interaction.user),
        target: toRizzUpUser(target),
        targetMessage,
        messages: relevantMessages,
      });

      generated = true;
      const contextCue = targetMessage.replace(/\s+/g, " ").trim();
      const cueWords = contextCue
        .split(/\s+/)
        .filter((word) => /[\p{L}\p{N}]{2,}/u.test(word));
      const contextNote =
        cueWords.length >= 2 || contextCue.length >= 16
          ? `\n\n-# Tailored to what ${escapeMarkdown(displayName(target))} said: “${escapeMarkdown(truncate(contextCue, 160))}”`
          : "";
      await interaction.editReply({
        content: `💌 **Your opener for ${escapeMarkdown(displayName(target))}**\n> ${line.replace(/\n/g, "\n> ")}${contextNote}`,
        components: [],
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error("Failed to run /rizz-up.", error);
      if (!generated) {
        try {
          await interaction.editReply(
            "I couldn't create a rizz-up right now. Please try again shortly.",
          );
        } catch (replyError) {
          console.error("Failed to report the /rizz-up error.", replyError);
        }
      }
    }
  },
});
