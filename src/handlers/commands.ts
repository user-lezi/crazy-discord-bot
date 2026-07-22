import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export enum CommandType {
  ChatInput,
}
export interface CommandData<T extends CommandType = CommandType> {
  data: T extends CommandType.ChatInput
    ? | SlashCommandBuilder
      | SlashCommandSubcommandsOnlyBuilder
      | SlashCommandOptionsOnlyBuilder
    : never;
  type: T;
  execute: (
    interaction: T extends CommandType.ChatInput
      ? ChatInputCommandInteraction
      : CommandInteraction,
  ) => Promise<unknown> | unknown;
  autocomplete?: T extends CommandType.ChatInput
    ? (interaction: AutocompleteInteraction) => Promise<unknown> | unknown
    : never;
}
export function createCommandData(data: CommandData): CommandData {
  return data;
}
