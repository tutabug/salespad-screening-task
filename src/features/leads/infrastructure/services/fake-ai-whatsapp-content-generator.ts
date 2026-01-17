import { Injectable } from '@nestjs/common';
import { ChannelMessageContentGenerator } from '../../domain/services/channel-message-content-generator';
import { MessageChannel } from '../../domain/value-objects/message-channel';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { WhatsAppChannelMessage } from '../../domain/entities/message.entity';

@Injectable()
export class FakeAIWhatsAppContentGenerator extends ChannelMessageContentGenerator<MessageChannel.WHATSAPP> {
  readonly channel = MessageChannel.WHATSAPP;

  async generate(event: LeadAddedEvent): Promise<WhatsAppChannelMessage> {
    const leadName = event.payload.name;

    return Promise.resolve({
      to: event.payload.phone!,
      text: this.buildWhatsAppText(leadName),
    });
  }

  private buildWhatsAppText(leadName: string): string {
    return `Hi ${leadName}! Thanks for your interest. We'd love to learn more about your needs. Looking forward to connecting with you soon! - The SalesPad Team`;
  }
}
