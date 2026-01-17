import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Command } from './command';
import { CommandBus } from './command-bus';

export const COMMAND_QUEUE_NAME = 'commands';

@Injectable()
export class BullMqCommandBus extends CommandBus {
  constructor(@InjectQueue(COMMAND_QUEUE_NAME) private readonly queue: Queue) {
    super();
  }

  async send<T>(command: Command<T>): Promise<void> {
    await this.queue.add(command.name, {
      id: command.id,
      correlationIds: command.correlationIds,
      payload: command.payload,
      createdAt: command.createdAt.toISOString(),
    });
  }
}
