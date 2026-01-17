import { Injectable } from '@nestjs/common';
import { MessageChannel, EmailChannelMessage, Message } from '@/shared/domain';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import { ChannelMessageContentGenerator } from '../../domain/services/channel-message-content-generator';

@Injectable()
export class FakeAIEmailContentGenerator extends ChannelMessageContentGenerator<MessageChannel.EMAIL> {
  readonly channel = MessageChannel.EMAIL;

  async generateForLeadAdded(event: LeadAddedEvent): Promise<EmailChannelMessage> {
    const leadName = event.payload.name;

    return Promise.resolve({
      to: event.payload.email!,
      subject: `Welcome, ${leadName}!`,
      body: this.buildEmailBody(leadName),
    });
  }

  async generateForLeadReplied(
    event: LeadRepliedEvent,
    previousMessages: Message<MessageChannel.EMAIL>[],
  ): Promise<EmailChannelMessage> {
    const previousMessage = previousMessages[0];
    const leadEmail = event.payload.lead.email;

    if (!leadEmail) {
      throw new Error('Lead email not found in previous messages or reply payload.');
    }

    return Promise.resolve({
      to: leadEmail,
      subject: `RE: Your inquiry - ${previousMessage?.channelMessage.subject || 'previous message subject'}`,
      body: this.buildReplyEmailBody(event.payload.lead.name),
    });
  }

  private buildEmailBody(leadName: string): string {
    return `Hi ${leadName},

Thanks for your interest! We would love to learn more about your needs.

Looking forward to connecting with you soon.

Best regards,
The SalesPad Team`;
  }

  private buildReplyEmailBody(leadName: string): string {
    return `Hi ${leadName},

Thank you for your message. We've received your reply and our team will review it shortly.

We appreciate your engagement and will get back to you as soon as possible.

Best regards,
The SalesPad Team`;
  }
}
