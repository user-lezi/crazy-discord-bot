import * as z from "zod";

import { AttachmentBuilder, Message as DiscordMessage, User } from "discord.js";

import { Message as OllamaMessage } from "ollama";
import { OllamaService } from "../../core/functions/ollama";
import { Users } from "../../users";
import { checkUserType } from "../../core/functions/checkUserType";
import { createEventData } from "../create";
import { createMeme } from "../../core/commands/ai/special-chatbot/meme";
import { getPrompt } from "../../core/commands/ai/utils";

const MAX_CONTEXT_MESSAGES = 20;
const MAX_CONTEXT_LENGTH = 1500;
const TYPING_REFRESH_MS = 8_000;
const DEFAULT_MODEL = "s1gnature/qwen3.5-uncensored-low-end:4b-q8_0";

interface ChatbotSession {
  model: string;
  history: OllamaMessage[];
  turns: {
    createdAt: string;
    input: string;
    rawOutput: z.infer<typeof ChatResponse>;
  }[];
}

interface ChatCommandContext {
  message: DiscordMessage;
  session: ChatbotSession;
  argument: string;
}

interface ChatCommand {
  description: string;
  execute: (context: ChatCommandContext) => Promise<void>;
}

const sessions = new Map<string, ChatbotSession>();
const busyUsers = new Set<string>();

class ChatbotFeatureError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
  }
}

const ReactionSchema = z.array(z.string().trim().min(1).max(30)).max(3);
const MemeSchema = z.object({
  type: z.enum(["simple-caps", "pov", "demotivator"]),
  topCaption: z.string().trim().min(1).max(140),
  bottomCaption: z.string().trim().max(140),
  targetUserId: z.string().nullable(),
});

const ChatResponse = z.object({
  responseType: z.enum(["reply", "gif", "meme"]),
  reply: z.string().trim().min(1).max(1900).nullable(),
  reaction: ReactionSchema,
  gifQuery: z.string().trim().min(1).max(120).nullable(),
  meme: MemeSchema.nullable(),
});

function getSession(userId: string): ChatbotSession {
  let session = sessions.get(userId);
  if (!session) {
    session = { model: DEFAULT_MODEL, history: [], turns: [] };
    sessions.set(userId, session);
  }
  return session;
}

function botMentionPattern(botId: string): RegExp {
  return new RegExp(`<@!?${botId}>`, "g");
}

function parseCommand(
  content: string,
  botId: string,
): {
  name: string;
  argument: string;
} | null {
  const text = content.replace(botMentionPattern(botId), "").trim();
  const match = /^--+\s*([a-z-]+)(?:\s+([\s\S]*))?$/i.exec(text);
  if (!match) return null;
  return { name: match[1].toLowerCase(), argument: match[2]?.trim() ?? "" };
}

async function sendText(
  message: DiscordMessage,
  content: string,
): Promise<void> {
  await message.reply({
    content,
    allowedMentions: { parse: [], repliedUser: false },
  });
}

async function listModels(message: DiscordMessage): Promise<void> {
  const response = await OllamaService.listModels();
  const names = response.models.map((model) => model.name).sort();
  if (!names.length) {
    await sendText(message, "No local Ollama models are installed.");
    return;
  }

  const pages: string[] = [];
  let page = "Available local models:\n";
  for (const name of names) {
    const line = `• ${name}\n`;
    if (page.length + line.length > 1800) {
      pages.push(page.trimEnd());
      page = "";
    }
    page += line;
  }
  pages.push(page.trimEnd());
  for (const content of pages) await sendText(message, content);
}

const chatCommands = new Map<string, ChatCommand>([
  [
    "help",
    {
      description: "Show chatbot commands.",
      async execute({ message }) {
        const commands = [...chatCommands.entries()]
          .map(([name, command]) => `\`-- ${name}\` — ${command.description}`)
          .join("\n");
        await sendText(message, `Chat commands:\n${commands}`);
      },
    },
  ],
  [
    "clear",
    {
      description: "Clear your conversation and reset your model.",
      async execute({ message, session }) {
        session.history = [];
        session.turns = [];
        session.model = DEFAULT_MODEL;
        await sendText(
          message,
          "Session cleared; your model is back to default.",
        );
      },
    },
  ],
  [
    "export",
    {
      description: "DM a JSON export of your current chat session.",
      async execute({ message, session }) {
        const exportedSession = {
          format: "special-chatbot-session",
          version: 1,
          exportedAt: new Date().toISOString(),
          session: {
            model: session.model,
            turns: session.turns,
          },
        };
        const attachment = new AttachmentBuilder(
          Buffer.from(JSON.stringify(exportedSession, null, 2), "utf8"),
          { name: "chatbot-session.json" },
        );

        try {
          await message.author.send({ files: [attachment] });
        } catch (error) {
          console.error("Failed to DM a chatbot session export.", error);
          await sendText(
            message,
            "I couldn't DM the export. Check that your server DMs are open and try again.",
          );
          return;
        }

        await sendText(message, "Sent your session export to your DMs.");
      },
    },
  ],
  [
    "models",
    {
      description: "List available local Ollama models.",
      async execute({ message }) {
        await listModels(message);
      },
    },
  ],
  [
    "model",
    {
      description: "Show or set your model: `-- model <name>`.",
      async execute({ message, session, argument }) {
        if (!argument) {
          await sendText(
            message,
            `Your current model is \`${session.model}\`. Here are the available models:`,
          );
          await listModels(message);
          return;
        }

        const response = await OllamaService.listModels();
        const model = response.models.find(
          (entry) => entry.name.toLowerCase() === argument.toLowerCase(),
        );
        if (!model) {
          await sendText(
            message,
            `I couldn't find \`${argument}\` among the installed models. Use \`-- models\` to see the available choices.`,
          );
          return;
        }
        session.model = model.name;
        await sendText(message, `Model set to \`${session.model}\`.`);
      },
    },
  ],
]);

async function getReferencedMessage(
  message: DiscordMessage,
): Promise<DiscordMessage | null> {
  if (!message.reference?.messageId) return null;
  try {
    return await message.fetchReference();
  } catch (error) {
    console.warn(
      "Couldn't fetch the referenced message for chatbot context.",
      error,
    );
    return null;
  }
}

async function getResponseContext(message: DiscordMessage): Promise<{
  shouldRespond: boolean;
  referencedMessage: DiscordMessage | null;
}> {
  const botId = message.client.user?.id;
  if (!botId) return { shouldRespond: false, referencedMessage: null };
  const mentioned = message.mentions.users.has(botId);
  const referencedMessage = await getReferencedMessage(message);
  return {
    shouldRespond: mentioned || referencedMessage?.author.id === botId,
    referencedMessage,
  };
}

function userContext(user: User, displayName = user.globalName): object {
  return {
    id: user.id,
    username: user.username,
    displayName,
    bot: user.bot,
  };
}

function getContext(
  message: DiscordMessage,
  referencedMessage: DiscordMessage | null,
): string {
  const member = message.member;
  const channel = message.channel;
  return JSON.stringify({
    user: {
      username: message.author.username,
      displayName: member?.displayName ?? message.author.globalName,
      createdAt: message.author.createdAt.toISOString(),
      joinedServerAt: member?.joinedAt?.toISOString() ?? null,
    },
    mentionedUsers: message.mentions.users.map((user) => {
      const mentionedMember = message.mentions.members?.get(user.id);
      return userContext(user, mentionedMember?.displayName ?? user.globalName);
    }),
    referencedMessage: referencedMessage
      ? {
          author: userContext(
            referencedMessage.author,
            referencedMessage.member?.displayName ??
              referencedMessage.author.globalName,
          ),
          content: referencedMessage.content.slice(0, MAX_CONTEXT_LENGTH),
          channelId: referencedMessage.channelId,
          createdAt: referencedMessage.createdAt.toISOString(),
          attachments: referencedMessage.attachments.map((attachment) => ({
            name: attachment.name,
            contentType: attachment.contentType,
          })),
        }
      : null,
    configuredBotUsers: Users.map((user) => ({
      id: user.id,
      types: user.type,
      username: message.client.users.cache.get(user.id)?.username ?? null,
      displayName:
        message.guild?.members.cache.get(user.id)?.displayName ?? null,
    })),
    server: message.guild
      ? {
          name: message.guild.name,
          description: message.guild.description,
          memberCount: message.guild.memberCount,
        }
      : null,
    channel: {
      name: "name" in channel ? channel.name : null,
      topic: "topic" in channel ? channel.topic : null,
      type: channel.type,
    },
  });
}

function getRelevantUsers(
  message: DiscordMessage,
  referencedMessage: DiscordMessage | null,
): User[] {
  const users = new Map<string, User>([[message.author.id, message.author]]);
  for (const user of message.mentions.users.values()) users.set(user.id, user);
  if (referencedMessage) {
    users.set(referencedMessage.author.id, referencedMessage.author);
  }
  return [...users.values()];
}

async function sendGif(message: DiscordMessage, query: string): Promise<void> {
  const apiKey = process.env.GiphyApiKey;
  if (!apiKey) {
    throw new ChatbotFeatureError(
      "GiphyApiKey is not configured.",
      "GIF search isn't set up yet. Add GiphyApiKey to the bot's environment first.",
    );
  }
  const endpoint = new URL("https://api.giphy.com/v1/gifs/search");
  endpoint.searchParams.set("api_key", apiKey);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("rating", "pg");
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new ChatbotFeatureError(
      `Giphy search failed (HTTP ${response.status}).`,
      "GIF search failed this time—try me again in a bit.",
    );
  }

  const result = z
    .object({
      data: z
        .array(
          z.object({
            images: z.object({
              original: z.object({ url: z.string().url() }),
            }),
          }),
        )
        .max(1),
    })
    .parse(await response.json());
  const gifUrl = result.data[0]?.images.original.url;
  if (!gifUrl) {
    await sendText(message, `Couldn't find a GIF for “${query}”.`);
    return;
  }
  await message.reply({
    content: gifUrl,
    allowedMentions: { parse: [], repliedUser: false },
  });
}

async function sendMeme(
  message: DiscordMessage,
  meme: NonNullable<z.infer<typeof ChatResponse>["meme"]>,
  relevantUsers: User[],
): Promise<void> {
  const user =
    relevantUsers.find((entry) => entry.id === meme.targetUserId) ??
    message.author;
  const attachment: AttachmentBuilder = await createMeme({
    ...meme,
    user,
  });
  await message.reply({
    files: [attachment],
    allowedMentions: { parse: [], repliedUser: false },
  });
}

function currentMessageText(message: DiscordMessage, botId: string): string {
  return message.content
    .replace(botMentionPattern(botId), "")
    .trim()
    .slice(0, MAX_CONTEXT_LENGTH);
}

function messageWithLocation(message: DiscordMessage, content: string): string {
  const channelName =
    "name" in message.channel ? message.channel.name : "unknown channel";
  const location = message.guild
    ? `#${channelName} in ${message.guild.name}`
    : "a direct message";
  return `[Sent in ${location}]: ${content}`;
}

export default createEventData({
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot) return;
    if (!checkUserType(message.author, ["developer", "special"], "any")) return;
    const responseContext = await getResponseContext(message);
    if (!responseContext.shouldRespond) return;
    const botId = message.client.user?.id;
    if (!botId) return;

    const session = getSession(message.author.id);
    const command = parseCommand(message.content, botId);
    if (command) {
      const handler = chatCommands.get(command.name);
      if (!handler) {
        await sendText(
          message,
          `Unknown command \`${command.name}\`. Use \`-- help\` to see available commands.`,
        );
        return;
      }
      try {
        await handler.execute({
          message,
          session,
          argument: command.argument,
        });
      } catch (error) {
        console.error(
          `Failed to run chatbot command "${command.name}".`,
          error,
        );
        await sendText(
          message,
          `I couldn't complete \`-- ${command.name}\` just now. Please try again.`,
        );
      }
      return;
    }

    if (busyUsers.has(message.author.id)) {
      await sendText(
        message,
        "I'm still catching up with your last message—try again in a moment.",
      );
      return;
    }
    busyUsers.add(message.author.id);
    let typingTimer: ReturnType<typeof setInterval> | undefined;

    try {
      const content = currentMessageText(message, botId);
      if (!content) {
        await sendText(message, "Hey—what's up?");
        return;
      }

      const referencedMessage = responseContext.referencedMessage;
      const context = getContext(message, referencedMessage);
      const prompt = getPrompt("special_user_chatbot.txt", [context]);
      const relevantUsers = getRelevantUsers(message, referencedMessage);
      const history = [
        ...session.history.slice(-MAX_CONTEXT_MESSAGES),
        {
          role: "user" as const,
          content: messageWithLocation(
            message,
            JSON.stringify({
              text: content,
              mentions: relevantUsers.map((user) => userContext(user)),
              referencedMessage: referencedMessage
                ? {
                    author: userContext(
                      referencedMessage.author,
                      referencedMessage.member?.displayName ??
                        referencedMessage.author.globalName,
                    ),
                    content: referencedMessage.content.slice(
                      0,
                      MAX_CONTEXT_LENGTH,
                    ),
                  }
                : null,
            }),
          ),
        },
      ];
      if (message.channel.isSendable()) {
        await message.channel.sendTyping().catch((error) => {
          console.warn("Couldn't show the chatbot typing indicator.", error);
        });
        typingTimer = setInterval(() => {
          if (!message.channel.isSendable()) return;
          void message.channel.sendTyping().catch((error) => {
            console.warn(
              "Couldn't refresh the chatbot typing indicator.",
              error,
            );
          });
        }, TYPING_REFRESH_MS);
      }
      const rawResponse = await OllamaService.chat({
        model: session.model,
        messages: [{ role: "system", content: prompt }, ...history],
        think: false,
        format: z.toJSONSchema(ChatResponse),
        options: { temperature: 0.85 },
      });
      const rawAiOutput = rawResponse.message.content;
      const parsedResponse = ChatResponse.parse(JSON.parse(rawAiOutput));
      session.turns.push({
        createdAt: new Date().toISOString(),
        input: messageWithLocation(message, content),
        rawOutput: parsedResponse,
      });
      switch (parsedResponse.responseType) {
        case "reply":
          if (parsedResponse.reply)
            await sendText(message, parsedResponse.reply);
          else if (!parsedResponse.reaction.length)
            throw new Error(
              "Chatbot returned neither reply text nor reactions.",
            );
          break;
        case "gif":
          if (!parsedResponse.gifQuery)
            throw new Error("Chatbot omitted its GIF search phrase.");
          await sendGif(message, parsedResponse.gifQuery);
          break;
        case "meme":
          if (!parsedResponse.meme)
            throw new Error("Chatbot omitted its meme instructions.");
          await sendMeme(message, parsedResponse.meme, relevantUsers);
          break;
      }
      for (const reaction of parsedResponse.reaction) {
        try {
          await message.react(reaction);
        } catch (error) {
          console.warn(`Couldn't add chatbot reaction "${reaction}".`, error);
        }
      }

      session.history.push(
        { role: "user", content: messageWithLocation(message, content) },
        {
          role: "assistant",
          content:
            parsedResponse.reply ??
            `[${parsedResponse.responseType}${parsedResponse.gifQuery ? `: ${parsedResponse.gifQuery}` : ""}${parsedResponse.reaction.length ? `; reacted ${parsedResponse.reaction.join(" ")}` : ""}]`,
        },
      );
      session.history = session.history.slice(-MAX_CONTEXT_MESSAGES);
    } catch (error) {
      console.error(
        "Failed to respond to a special/developer user message.",
        error,
      );
      try {
        await sendText(
          message,
          error instanceof ChatbotFeatureError
            ? error.userMessage
            : "I blanked for a sec—try me again in a moment.",
        );
      } catch (replyError) {
        console.error("Failed to send the chatbot error reply.", replyError);
      }
    } finally {
      if (typingTimer) clearInterval(typingTimer);
      busyUsers.delete(message.author.id);
    }
  },
});
