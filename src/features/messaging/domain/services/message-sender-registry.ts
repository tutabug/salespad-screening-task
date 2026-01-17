import { MessageChannel } from '@/shared/domain';
import { MessageSender } from './message-sender';

export abstract class MessageSenderRegistry {
  abstract register(sender: MessageSender): void;
  abstract get(channel: MessageChannel): MessageSender | undefined;
}
