import { Injectable } from '@nestjs/common';
import { MessageChannel, WhatsAppChannelMessage, Message } from '@/shared/domain';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import { ChannelMessageContentGenerator } from '../../domain/services/channel-message-content-generator';

@Injectable()
export class FakeAIWhatsAppContentGenerator extends ChannelMessageContentGenerator<MessageChannel.WHATSAPP> {
  readonly channel = MessageChannel.WHATSAPP;

  async generateForLeadAdded(event: LeadAddedEvent): Promise<WhatsAppChannelMessage> {
    const leadName = event.payload.name;

    return {
      to: event.payload.phone!,
      text: this.buildWhatsAppText(leadName),
    };
  }

  async generateForLeadReplied(
    event: LeadRepliedEvent,
    previousMessages: Message<MessageChannel.WHATSAPP>[],
  ): Promise<WhatsAppChannelMessage> {
    const previousMessage = previousMessages[0];
    const leadPhone =
      previousMessage?.channelMessage?.to ||
      (event.payload.leadMessage.channelMessage as WhatsAppChannelMessage).to;

    return {
      to: leadPhone,
      text: this.buildReplyWhatsAppText(event.payload.leadMessage),
    };
  }

  private buildWhatsAppText(leadName: string): string {
    return `Hi ${leadName}! Thanks for your interest. We'd love to learn more about your needs. Looking forward to connecting with you soon! - The SalesPad Team`;
  }

  private buildReplyWhatsAppText(incomingMessage: Message): string {
    return `Thanks for your message! We've received your reply and will get back to you shortly. - The SalesPad Team`;
  }
}
