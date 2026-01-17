import { Injectable } from '@nestjs/common';
import { ChannelContentGeneratorRegistry } from '../../domain/services/channel-content-generator-registry';
import { ChannelMessageContentGenerator } from '../../domain/services/channel-message-content-generator';
import { MessageChannel } from '../../domain/value-objects/message-channel';

@Injectable()
export class DefaultChannelContentGeneratorRegistry extends ChannelContentGeneratorRegistry {
  private readonly generators = new Map<MessageChannel, ChannelMessageContentGenerator>();

  register(generator: ChannelMessageContentGenerator): void {
    this.generators.set(generator.channel, generator);
  }

  get(channel: MessageChannel): ChannelMessageContentGenerator | undefined {
    return this.generators.get(channel);
  }
}
