import { Injectable } from '@nestjs/common';
import { MessageChannel } from '@/shared/domain';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';

@Injectable()
export class DefaultChannelResolver {
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
