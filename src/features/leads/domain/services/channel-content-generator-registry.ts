import { MessageChannel } from '@/shared/domain';
import { ChannelMessageContentGenerator } from './channel-message-content-generator';

export abstract class ChannelContentGeneratorRegistry {
  abstract register(generator: ChannelMessageContentGenerator<any>): void;
  abstract get<TChannel extends MessageChannel>(
    channel: TChannel,
  ): ChannelMessageContentGenerator<TChannel> | undefined;
}
