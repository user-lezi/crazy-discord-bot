import {
  ChatInputCommandInteraction,
  ContainerBuilder,
  ContextMenuCommandInteraction,
  InteractionEditReplyOptions,
  Message,
  MessageComponentInteraction,
  MessageFlags,
  MessagePayloadOption,
  User,
} from "discord.js";

export type AnyRepliableInteraction =
  ChatInputCommandInteraction | MessageComponentInteraction | ContextMenuCommandInteraction;

/**
 * Handles routing interaction responses seamlessly across initial replies,
 * deferred edits, subsequent thread follow-ups, and optional self-deletion lifecycles.
 */
export async function interactionReply<I extends AnyRepliableInteraction>(
  interaction: I,
  payload: Omit<MessagePayloadOption | InteractionEditReplyOptions, "flags"> & {
    flags?: MessageFlags;
  },
  returnResponse = false,
  deleteIn: number | null = null,
  isFollowUp = false,
  onerr: (err: any) => void = () => {},
): Promise<Message<boolean> | null> {
  let res;

  if (isFollowUp) {
    res = await interaction.followUp(payload as any).catch(onerr);
  } else if (interaction.replied || interaction.deferred) {
    res = await interaction.editReply(payload as any).catch(onerr);
  } else {
    res = await interaction.reply(payload as any).catch(onerr);
  }

  if (!res) return null;

  if (returnResponse || deleteIn) {
    const msg =
      res instanceof Message
        ? res
        : await interaction.fetchReply().catch(onerr);

    if (msg && msg instanceof Message && deleteIn) {
      setTimeout(() => {
        msg.delete().catch(onerr);
      }, deleteIn);
    }

    return msg instanceof Message ? msg : null;
  }

  return null;
}

/**
 * Global template shortcuts
 */
export const ReadyMadeReplies = {
  /**
   * Used when a non-owner tries to click components/buttons on someone else's command session.
   */
  authorOnly: async (
    i: AnyRepliableInteraction,
    customMessage?: string,
    isFollowUp = false,
  ) => {
    return interactionReply(
      i,
      {
        content:
          customMessage ??
          "This session belongs to someone else. Run your own command sequence to interact!",
        flags: MessageFlags.Ephemeral,
      },
      false,
      null,
      isFollowUp,
    );
  },

  /**
   * Standard fallback catch for `try/catch` execution blocks when things unexpectedly break.
   */
  unknownError: async (
    i: AnyRepliableInteraction,
    errorContext?: any,
    isFollowUp = false,
  ) => {
    // Log the actual error to your internal console dashboard for maintenance tracking
    if (errorContext) console.error(`[Error Handler]:`, errorContext);

    const container = new ContainerBuilder()
      .setAccentColor(0x2b2d31) // Sleek dark charcoal
      .addTextDisplayComponents((t) =>
        t.setContent(`An unexpected error occurred.`),
      );

    return interactionReply(
      i,
      {
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      },
      false,
      null,
      isFollowUp,
    );
  },
};
