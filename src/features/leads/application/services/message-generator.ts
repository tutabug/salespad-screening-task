import { Injectable } from '@nestjs/common';
import { DefaultChannelResolver } from './channel-resolver';
import { DefaultChannelContentGeneratorRegistry } from './channel-content-generator-registry';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';
import { Message, MessageChannel } from '@/shared/domain';

@Injectable()
export class DefaultMessagesGenerator {
  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly channelResolver: DefaultChannelResolver,
    private readonly contentGeneratorRegistry: DefaultChannelContentGeneratorRegistry,
  ) {}

  async generate(event: LeadAddedEvent): Promise<Message[]> {
    const channels = this.channelResolver.resolve(event);

    return Promise.all(channels.map((channel) => this.createMessage(channel, event)));
  }

  private async createMessage(channel: MessageChannel, event: LeadAddedEvent): Promise<Message> {
    const generator = this.contentGeneratorRegistry.get(channel);
    if (!generator) {
      throw new Error(`No content generator registered for channel: ${channel}`);
    }

    const channelMessage = await generator.generateForLeadAdded(event);

    return new Message(this.uuidGenerator.generate(), channel, channelMessage);
  }
}
