import {
  AnyRepliableInteraction,
  interactionReply,
} from "../util/interactionReply";
import {
  AutocompleteInteraction,
  Client,
  Collection,
  ContextMenuCommandBuilder,
  MessageComponentInteraction,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  Snowflake,
} from "discord.js";

import { ClientCommands } from "../commands";
import { Promiseable } from "../util/types";

export interface ICommandMeta {
  description: string | [short: string, long: string];
  [x: string]: any;
}

export type CommandRestricter =
  | Snowflake
  | "developers"
  | ((
      this: Client,
      interaction: Exclude<
        AnyRepliableInteraction,
        MessageComponentInteraction
      >,
    ) => Promiseable<boolean>);
export type ICommandExecutor = (
  this: Client,
  ctx: {
    interaction: Exclude<AnyRepliableInteraction, MessageComponentInteraction>;
    reply: typeof interactionReply;
    command: ICommand;
  },
) => Promiseable<unknown>;
export interface ICommand {
  data: {
    builder:
      | SlashCommandBuilder
      | SlashCommandOptionsOnlyBuilder
      | SlashCommandSubcommandsOnlyBuilder
      | ContextMenuCommandBuilder;
    restrictTo?: CommandRestricter[];
    meta?: ICommandMeta;
  };

  execute: ICommandExecutor;
  preexecute?: ICommandExecutor;
  postexecute?: ICommandExecutor;

  autocomplete?: (
    this: Client,
    interaction: AutocompleteInteraction,
  ) => Promiseable<unknown>;
}

export class CommandManager {
  public commands = new Collection<number, ICommand>();
  constructor(public client: Client) {}

  async load() {
    console.log("Loading commands...");

    for (const command of ClientCommands) {
      this.commands.set(this.commands.size, command);
    }

    console.log(
      `Loaded ${ClientCommands.length} command${ClientCommands.length === 1 ? "" : "s"}.`,
    );

    if (!process.env.BotToken || !process.env.BotID) {
      console.warn(
        "BotToken or BotID is missing. Skipping slash command registration.",
      );
      return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.BotToken);

    try {
      console.log("Registering application commands...");

      const data = (await rest.put(
        Routes.applicationCommands(process.env.BotID),
        {
          body: ClientCommands.map((c) => c.data.builder.toJSON()),
        },
      )) as unknown[];

      console.log(`Registered ${data.length} application command(s).`);
    } catch (error) {
      console.error("Failed to register application commands.");
      console.error(error);
    }
  }

  get size() {
    return this.commands.size;
  }
}
