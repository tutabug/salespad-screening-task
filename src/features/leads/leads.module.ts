import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AddLeadUseCase } from './application/use-cases/add-lead.use-case';
import { ReplyToLeadUseCase } from './application/use-cases/reply-to-lead.use-case';
import {
  GetLeadDetailsQuery,
  PrismaGetLeadDetailsQuery,
} from './application/use-cases/get-lead-details';
import { SendMessageToLeadOnLeadAddedHandler } from './application/event-handlers/send-message-to-lead-on-lead-added.handler';
import { SendMessageToLeadOnLeadRepliedHandler } from './application/event-handlers/send-message-to-lead-on-lead-replied.handler';
import { LeadRepository } from './domain/repositories/lead.repository';
import { MessageRepository } from './domain/repositories/message.repository';
import { DefaultMessagesGenerator } from './application/services/message-generator';
import { DefaultChannelResolver } from './application/services/channel-resolver';
import { DefaultChannelContentGeneratorRegistry } from './application/services/channel-content-generator-registry';
import { PrismaLeadRepository } from './infrastructure/repositories/prisma-lead.repository';
import { PrismaMessageRepository } from './infrastructure/repositories/prisma-message.repository';
import { FakeAIEmailContentGenerator } from './infrastructure/services/fake-ai-email-content-generator';
import { FakeAIWhatsAppContentGenerator } from './infrastructure/services/fake-ai-whatsapp-content-generator';
import { LeadsController } from './presentation/controllers/leads.controller';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';
import { BullMqCommandBus, CommandBus, COMMAND_QUEUE_NAME } from '@/shared/infrastructure/commands';

@Module({
  imports: [
    BullModule.registerQueue({
      name: COMMAND_QUEUE_NAME,
    }),
  ],
  controllers: [LeadsController],
  providers: [
    AddLeadUseCase,
    ReplyToLeadUseCase,
    SendMessageToLeadOnLeadAddedHandler,
    SendMessageToLeadOnLeadRepliedHandler,
    FakeAIEmailContentGenerator,
    FakeAIWhatsAppContentGenerator,
    DefaultMessagesGenerator,
    {
      provide: LeadRepository,
      useClass: PrismaLeadRepository,
    },
    {
      provide: MessageRepository,
      useClass: PrismaMessageRepository,
    },
    {
      provide: GetLeadDetailsQuery,
      useClass: PrismaGetLeadDetailsQuery,
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
  ],
})
export class LeadsModule {}
