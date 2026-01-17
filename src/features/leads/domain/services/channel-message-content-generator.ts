import { MessageChannel } from '../value-objects/message-channel';
import { LeadAddedEvent } from '../events/lead-added.event';
import { ChannelMessageMap } from '../entities/message.entity';

export abstract class ChannelMessageContentGenerator<
  TChannel extends MessageChannel = MessageChannel,
> {
  abstract readonly channel: TChannel;
  abstract generate(event: LeadAddedEvent): Promise<ChannelMessageMap[TChannel]>;
}
