import { Inject, Injectable } from '@nestjs/common';
import { Message, ChannelMessageMap } from '../../domain/entities/message.entity';
import { MessageChannel } from '../../domain/value-objects/message-channel';
import { MessageGenerator } from '../../domain/services/message-generator';
import { ChannelResolver } from '../../domain/services/channel-resolver';
import { ChannelMessageContentGenerator } from '../../domain/services/channel-message-content-generator';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

export const CHANNEL_CONTENT_GENERATORS = 'CHANNEL_CONTENT_GENERATORS';

@Injectable()
export class StaticMessageGenerator extends MessageGenerator {
  private readonly generatorRegistry: Map<MessageChannel, ChannelMessageContentGenerator>;

  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly channelResolver: ChannelResolver,
    @Inject(CHANNEL_CONTENT_GENERATORS)
    contentGenerators: ChannelMessageContentGenerator[],
  ) {
    super();
    this.generatorRegistry = new Map(contentGenerators.map((gen) => [gen.channel, gen]));
  }

  async generate(event: LeadAddedEvent): Promise<Message[]> {
    const channels = this.channelResolver.resolve(event);

    return Promise.all(channels.map((channel) => this.createMessage(channel, event)));
  }

  private async createMessage(channel: MessageChannel, event: LeadAddedEvent): Promise<Message> {
    const generator = this.generatorRegistry.get(channel);
    if (!generator) {
      throw new Error(`No content generator registered for channel: ${channel}`);
    }

    const channelMessage = await generator.generate(event);

    return new Message(this.uuidGenerator.generate(), channel, channelMessage);
  }
}
