import { MessageChannel } from '../value-objects/message-channel';
import { LeadAddedEvent } from '../events/lead-added.event';

export abstract class ChannelResolver {
  abstract resolve(event: LeadAddedEvent): MessageChannel[];
}
