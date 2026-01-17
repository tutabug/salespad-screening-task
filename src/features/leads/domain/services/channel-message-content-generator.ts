import { MessageChannel, ChannelMessageMap, Message } from '@/shared/domain';
import { LeadAddedEvent } from '../events/lead-added.event';
import { LeadRepliedEvent } from '../events/lead-replied.event';

export abstract class ChannelMessageContentGenerator<TChannel extends MessageChannel> {
  abstract readonly channel: TChannel;

  abstract generateForLeadAdded(event: LeadAddedEvent): Promise<ChannelMessageMap[TChannel]>;

  abstract generateForLeadReplied(
    event: LeadRepliedEvent,
    previousMessages: Message<TChannel>[],
  ): Promise<ChannelMessageMap[TChannel]>;
}
