import { MessageChannel } from '../value-objects/message-channel';
import { ChannelMessageContentGenerator } from './channel-message-content-generator';

export abstract class ChannelContentGeneratorRegistry {
  abstract register(generator: ChannelMessageContentGenerator): void;
  abstract get(channel: MessageChannel): ChannelMessageContentGenerator | undefined;
}
