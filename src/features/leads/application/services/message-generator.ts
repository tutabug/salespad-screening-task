import { Injectable } from '@nestjs/common';
import { MessageGenerator as MessagesGenerator } from '../../domain/services/message-generator';
import { DefaultChannelResolver } from './channel-resolver';
import { DefaultChannelContentGeneratorRegistry } from './channel-content-generator-registry';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';
import { Message, MessageChannel } from '@/shared/domain';

@Injectable()
export class DefaultMessagesGenerator extends MessagesGenerator {
  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly channelResolver: DefaultChannelResolver,
    private readonly contentGeneratorRegistry: DefaultChannelContentGeneratorRegistry,
  ) {
    super();
  }

  async generate(event: LeadAddedEvent): Promise<Message[]> {
    const channels = this.channelResolver.resolve(event);

    return Promise.all(channels.map((channel) => this.createMessage(channel, event)));
  }

  private async createMessage(channel: MessageChannel, event: LeadAddedEvent): Promise<Message> {
    const generator = this.contentGeneratorRegistry.get(channel);
    if (!generator) {
      throw new Error(`No content generator registered for channel: ${channel}`);
    }

    const channelMessage = await generator.generate(event);

    return new Message(this.uuidGenerator.generate(), channel, channelMessage);
  }
}
