import { Module } from '@nestjs/common';
import { SendMessageCommandProcessor } from './application/processors/send-message-command.processor';
import { MessageSenderRegistry } from './domain/services/message-sender-registry';
import { DefaultMessageSenderRegistry } from './application/services/default-message-sender-registry';
import { FakeEmailSender } from './infrastructure/services/fake-email-sender';
import { FakeWhatsAppSender } from './infrastructure/services/fake-whatsapp-sender';

@Module({
  providers: [
    SendMessageCommandProcessor,
    FakeEmailSender,
    FakeWhatsAppSender,
    {
      provide: MessageSenderRegistry,
      useFactory: (emailSender: FakeEmailSender, whatsAppSender: FakeWhatsAppSender) => {
        const registry = new DefaultMessageSenderRegistry();
        registry.register(emailSender);
        registry.register(whatsAppSender);
        return registry;
      },
      inject: [FakeEmailSender, FakeWhatsAppSender],
    },
  ],
})
export class MessagingModule {}
