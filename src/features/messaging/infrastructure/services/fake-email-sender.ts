import { Injectable, Logger } from '@nestjs/common';
import { MessageSender } from '../../domain/services/message-sender';
import { MessageChannel, EmailChannelMessage } from '@/shared/domain';

@Injectable()
export class FakeEmailSender extends MessageSender<MessageChannel.EMAIL> {
  private readonly logger = new Logger(FakeEmailSender.name);
  readonly channel = MessageChannel.EMAIL;

  async send(channelMessage: EmailChannelMessage): Promise<void> {
    this.logger.log(`📧 Sending email to: ${channelMessage.to}`);
    this.logger.log(`   Subject: ${channelMessage.subject}`);
    this.logger.log(`   Body: ${channelMessage.body}`);

    // Simulate async send
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.logger.log(`✅ Email sent successfully to ${channelMessage.to}`);
  }
}
