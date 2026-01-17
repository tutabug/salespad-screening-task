import { Module } from '@nestjs/common';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { SendMessageToLeadOnLeadAddedHandler } from './application/event-handlers/send-message-to-lead-on-lead-added.handler';
import { LeadRepository } from './domain/repositories/lead.repository';
import { MessageRepository } from './domain/repositories/message.repository';
import { MessageGenerator } from './domain/services/message-generator';
import { DefaultMessagesGenerator } from './application/services/message-generator';
import { DefaultChannelResolver } from './application/services/channel-resolver';
import { DefaultChannelContentGeneratorRegistry } from './application/services/channel-content-generator-registry';
import { PrismaLeadRepository } from './infrastructure/repositories/prisma-lead.repository';
import { PrismaMessageRepository } from './infrastructure/repositories/prisma-message.repository';
import { FakeAIEmailContentGenerator } from './infrastructure/services/fake-ai-email-content-generator';
import { FakeAIWhatsAppContentGenerator } from './infrastructure/services/fake-ai-whatsapp-content-generator';
import { LeadsController } from './presentation/controllers/leads.controller';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';
import { BullMqCommandBus, CommandBus } from '@/shared/infrastructure/commands';

@Module({
  controllers: [LeadsController],
  providers: [
    CreateLeadUseCase,
    SendMessageToLeadOnLeadAddedHandler,
    FakeAIEmailContentGenerator,
    FakeAIWhatsAppContentGenerator,
    {
      provide: LeadRepository,
      useClass: PrismaLeadRepository,
    },
    {
      provide: MessageRepository,
      useClass: PrismaMessageRepository,
    },
    {
      provide: UuidGenerator,
      useClass: CryptoUuidGenerator,
    },
    {
      provide: CommandBus,
      useClass: BullMqCommandBus,
    },
    DefaultChannelResolver,
    {
      provide: DefaultChannelContentGeneratorRegistry,
      useFactory: (
        emailGenerator: FakeAIEmailContentGenerator,
        whatsAppGenerator: FakeAIWhatsAppContentGenerator,
      ) => {
        const registry = new DefaultChannelContentGeneratorRegistry();
        registry.register(emailGenerator);
        registry.register(whatsAppGenerator);
        return registry;
      },
      inject: [FakeAIEmailContentGenerator, FakeAIWhatsAppContentGenerator],
    },
    {
      provide: MessageGenerator,
      useClass: DefaultMessagesGenerator,
    },
  ],
})
export class LeadsModule {}
