import { Command } from './command';
import { CommandBus } from './command-bus';

export class FakeCommandBus extends CommandBus {
  private readonly sentCommands: Command<unknown>[] = [];

  async send<T>(command: Command<T>): Promise<void> {
    await Promise.resolve(this.sentCommands.push(command as Command<unknown>));
  }

  getSentCommands(): Command<unknown>[] {
    return [...this.sentCommands];
  }

  getLastCommand(): Command<unknown> | undefined {
    return this.sentCommands[this.sentCommands.length - 1];
  }

  reset(): void {
    this.sentCommands.length = 0;
  }
}
