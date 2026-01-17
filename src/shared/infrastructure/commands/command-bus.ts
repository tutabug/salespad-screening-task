import { Command } from './command';

export abstract class CommandBus {
  abstract send<T>(command: Command<T>): Promise<void>;
}
