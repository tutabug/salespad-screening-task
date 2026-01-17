import { Injectable } from '@nestjs/common';
import { MessageChannel } from '@/shared/domain';
import { ChannelMessageContentGenerator } from '../../domain/services/channel-message-content-generator';

@Injectable()
export class DefaultChannelContentGeneratorRegistry {
  private readonly generators = new Map<MessageChannel, ChannelMessageContentGenerator<any>>();

  register(generator: ChannelMessageContentGenerator<any>): void {
    this.generators.set(generator.channel, generator);
  }

  get<TChannel extends MessageChannel>(
    channel: TChannel,
  ): ChannelMessageContentGenerator<TChannel> | undefined {
    return this.generators.get(channel) as ChannelMessageContentGenerator<TChannel> | undefined;
  }
}
