import { Command } from '@/shared/infrastructure/commands';
import { Message } from '@/shared/domain';

export class SendMessageCommand extends Command<Message> {
  readonly name = 'send-message';

  constructor(id: string, correlationIds: Record<string, string>, payload: Message) {
    super(id, correlationIds, payload);
  }
}
