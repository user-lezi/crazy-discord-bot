import { CommandBuilder, ICommand } from "../managers/CommandManager";

export function CreateCommand<TBuilder extends CommandBuilder>(
  command: ICommand<TBuilder>,
): ICommand<TBuilder> {
  return command;
}
