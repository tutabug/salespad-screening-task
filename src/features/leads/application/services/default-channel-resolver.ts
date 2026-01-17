import { Injectable } from '@nestjs/common';
import { ChannelResolver } from '../../domain/services/channel-resolver';
import { MessageChannel } from '../../domain/value-objects/message-channel';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';

@Injectable()
export class DefaultChannelResolver extends ChannelResolver {
  resolve(event: LeadAddedEvent): MessageChannel[] {
    const channels: MessageChannel[] = [];

    if (event.payload.email) {
      channels.push(MessageChannel.EMAIL);
    }

    if (event.payload.phone) {
      channels.push(MessageChannel.WHATSAPP);
    }

    return channels;
  }
}
