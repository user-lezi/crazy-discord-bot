import {
  AnyRepliableInteraction,
  interactionReply,
} from "../util/interactionReply";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  Collection,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
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

export type SlashCommandBuilderLike =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type CommandBuilder =
  SlashCommandBuilderLike | ContextMenuCommandBuilder;

export type InteractionForBuilder<TBuilder extends CommandBuilder> =
  TBuilder extends SlashCommandBuilderLike
    ? ChatInputCommandInteraction
    : TBuilder extends ContextMenuCommandBuilder
      ? ContextMenuCommandInteraction
      : never;

export type CommandRestricter<
  TBuilder extends CommandBuilder = CommandBuilder,
> =
  | Snowflake
  | "developers"
  | ((
      this: Client,
      interaction: InteractionForBuilder<TBuilder>,
    ) => Promiseable<boolean>);

export type ICommandExecutor<TBuilder extends CommandBuilder = CommandBuilder> =
  (
    this: Client,
    ctx: {
      interaction: InteractionForBuilder<TBuilder>;
      reply: typeof interactionReply;
      command: ICommand<TBuilder>;
    },
  ) => Promiseable<unknown>;

export interface ICommand<TBuilder extends CommandBuilder = CommandBuilder> {
  data: {
    builder: TBuilder;
    restrictTo?: CommandRestricter<TBuilder>[];
    meta?: ICommandMeta;
  };

  execute: ICommandExecutor<TBuilder>;
  preexecute?: ICommandExecutor<TBuilder>;
  postexecute?: ICommandExecutor<TBuilder>;

  autocomplete?: TBuilder extends SlashCommandBuilderLike
    ? (
        this: Client,
        interaction: AutocompleteInteraction,
      ) => Promiseable<unknown>
    : never;
}

export class CommandManager {
  public commands = new Collection<number, ICommand>();
  constructor(public client: Client) {}

  async load() {
    console.log("Loading commands...");

    for (const command of ClientCommands) {
      this.commands.set(this.commands.size, command as any);
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
