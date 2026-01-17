import { Injectable } from '@nestjs/common';
import { Message, EmailChannelMessage } from '../../domain/entities/message.entity';
import { MessageChannel } from '../../domain/value-objects/message-channel';
import { MessageGenerator } from '../../domain/services/message-generator';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class StaticMessageGenerator extends MessageGenerator {
  constructor(private readonly uuidGenerator: UuidGenerator) {
    super();
  }

  generate(event: LeadAddedEvent): Message[] {
    const messages: Message[] = [];

    // For now, only generate email messages
    if (event.payload.email) {
      const emailMessage = this.createEmailMessage(event);
      messages.push(emailMessage);
    }

    return messages;
  }

  private createEmailMessage(event: LeadAddedEvent): Message<MessageChannel.EMAIL> {
    const channelMessage: EmailChannelMessage = {
      to: event.payload.email!,
      subject: `Welcome, ${event.payload.name}!`,
      body: this.buildEmailBody(event.payload.name),
    };

    return new Message(this.uuidGenerator.generate(), MessageChannel.EMAIL, channelMessage);
  }

  private buildEmailBody(leadName: string): string {
    return `Hi ${leadName},

Thanks for your interest! We would love to learn more about your needs.

Looking forward to connecting with you soon.

Best regards,
The SalesPad Team`;
  }
}
