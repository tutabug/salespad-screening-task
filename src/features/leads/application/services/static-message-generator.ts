import { Injectable } from '@nestjs/common';
import { Message } from '../../domain/entities/message.entity';
import { MessageChannel } from '../../domain/value-objects/message-channel';
import { MessageGenerator } from '../../domain/services/message-generator';
import { ChannelResolver } from '../../domain/services/channel-resolver';
import { ChannelContentGeneratorRegistry } from '../../domain/services/channel-content-generator-registry';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class StaticMessageGenerator extends MessageGenerator {
  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly channelResolver: ChannelResolver,
    private readonly contentGeneratorRegistry: ChannelContentGeneratorRegistry,
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
