import { Module } from '@nestjs/common';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { SendMessageToLeadOnLeadAddedHandler } from './application/event-handlers/send-message-to-lead-on-lead-added.handler';
import { LeadRepository } from './domain/repositories/lead.repository';
import { MessageGenerator } from './domain/services/message-generator';
import { PrismaLeadRepository } from './infrastructure/repositories/prisma-lead.repository';
import { StaticMessageGenerator } from './infrastructure/services/static-message-generator';
import { LeadsController } from './presentation/controllers/leads.controller';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';
import { BullMqCommandBus, CommandBus } from '@/shared/infrastructure/commands';

@Module({
  controllers: [LeadsController],
  providers: [
    CreateLeadUseCase,
    SendMessageToLeadOnLeadAddedHandler,
    {
      provide: LeadRepository,
      useClass: PrismaLeadRepository,
    },
    {
      provide: UuidGenerator,
      useClass: CryptoUuidGenerator,
    },
    {
      provide: CommandBus,
      useClass: BullMqCommandBus,
    },
    {
      provide: MessageGenerator,
      useClass: StaticMessageGenerator,
    },
  ],
})
export class LeadsModule {}
