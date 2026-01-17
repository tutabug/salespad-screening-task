import { Injectable, Logger } from '@nestjs/common';
import { MessageSender } from '../../domain/services/message-sender';
import { MessageChannel, WhatsAppChannelMessage } from '@/shared/domain';

@Injectable()
export class FakeWhatsAppSender extends MessageSender<MessageChannel.WHATSAPP> {
  private readonly logger = new Logger(FakeWhatsAppSender.name);
  readonly channel: MessageChannel.WHATSAPP = MessageChannel.WHATSAPP;

  async send(channelMessage: WhatsAppChannelMessage): Promise<void> {
    this.logger.log(`📱 Sending WhatsApp to: ${channelMessage.to}`);
    this.logger.log(`   Text: ${channelMessage.text}`);

    // Simulate async send
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.logger.log(`✅ WhatsApp sent successfully to ${channelMessage.to}`);
  }
}
