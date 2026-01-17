import { Injectable } from '@nestjs/common';
import {
  Message,
  EmailChannelMessage,
  WhatsAppChannelMessage,
} from '../../domain/entities/message.entity';
import { MessageChannel } from '../../domain/value-objects/message-channel';
import { MessageGenerator } from '../../domain/services/message-generator';
import { ChannelResolver } from '../../domain/services/channel-resolver';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class StaticMessageGenerator extends MessageGenerator {
  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly channelResolver: ChannelResolver,
  ) {
    super();
  }

  generate(event: LeadAddedEvent): Message[] {
    const channels = this.channelResolver.resolve(event);

    return channels.map((channel) => this.createMessage(channel, event));
  }

  private createMessage(channel: MessageChannel, event: LeadAddedEvent): Message {
    switch (channel) {
      case MessageChannel.EMAIL:
        return this.createEmailMessage(event);
      case MessageChannel.WHATSAPP:
        return this.createWhatsAppMessage(event);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private createEmailMessage(event: LeadAddedEvent): Message<MessageChannel.EMAIL> {
    const channelMessage: EmailChannelMessage = {
      to: event.payload.email!,
      subject: `Welcome, ${event.payload.name}!`,
      body: this.buildEmailBody(event.payload.name),
    };

    return new Message(this.uuidGenerator.generate(), MessageChannel.EMAIL, channelMessage);
  }

  private createWhatsAppMessage(event: LeadAddedEvent): Message<MessageChannel.WHATSAPP> {
    const channelMessage: WhatsAppChannelMessage = {
      to: event.payload.phone!,
      text: this.buildWhatsAppText(event.payload.name),
    };

    return new Message(this.uuidGenerator.generate(), MessageChannel.WHATSAPP, channelMessage);
  }

  private buildEmailBody(leadName: string): string {
    return `Hi ${leadName},

Thanks for your interest! We would love to learn more about your needs.

Looking forward to connecting with you soon.

Best regards,
The SalesPad Team`;
  }

  private buildWhatsAppText(leadName: string): string {
    return `Hi ${leadName}! Thanks for your interest. We'd love to learn more about your needs. Looking forward to connecting with you soon! - The SalesPad Team`;
  }
}
