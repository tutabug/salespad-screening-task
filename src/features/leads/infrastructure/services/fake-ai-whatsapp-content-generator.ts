import { Injectable } from '@nestjs/common';
import { MessageChannel, WhatsAppChannelMessage } from '@/shared/domain';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';

@Injectable()
export class FakeAIWhatsAppContentGenerator {
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
