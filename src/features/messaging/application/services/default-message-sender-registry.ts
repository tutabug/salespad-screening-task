import { Injectable } from '@nestjs/common';
import { MessageSenderRegistry } from '../../domain/services/message-sender-registry';
import { MessageSender } from '../../domain/services/message-sender';
import { MessageChannel } from '@/shared/domain';

@Injectable()
export class DefaultMessageSenderRegistry extends MessageSenderRegistry {
  private readonly senders = new Map<MessageChannel, MessageSender>();

  register(sender: MessageSender): void {
    this.senders.set(sender.channel, sender);
  }

  get(channel: MessageChannel): MessageSender | undefined {
    return this.senders.get(channel);
  }
}
