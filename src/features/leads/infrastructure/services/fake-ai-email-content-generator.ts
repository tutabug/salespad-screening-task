import { Injectable } from '@nestjs/common';
import { MessageChannel, EmailChannelMessage } from '@/shared/domain';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';

@Injectable()
export class FakeAIEmailContentGenerator {
  readonly channel = MessageChannel.EMAIL;

  async generate(event: LeadAddedEvent): Promise<EmailChannelMessage> {
    const leadName = event.payload.name;

    return Promise.resolve({
      to: event.payload.email!,
      subject: `Welcome, ${leadName}!`,
      body: this.buildEmailBody(leadName),
    });
  }

  private buildEmailBody(leadName: string): string {
    return `Hi ${leadName},

Thanks for your interest! We would love to learn more about your needs.

Looking forward to connecting with you soon.

Best regards,
The SalesPad Team`;
  }
}
