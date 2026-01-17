import { Module } from '@nestjs/common';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { LeadRepository } from './domain/repositories/lead.repository';
import { PrismaLeadRepository } from './infrastructure/repositories/prisma-lead.repository';
import { LeadsController } from './presentation/controllers/leads.controller';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';

@Module({
  controllers: [LeadsController],
  providers: [
    CreateLeadUseCase,
    {
      provide: LeadRepository,
      useClass: PrismaLeadRepository,
    },
    {
      provide: UuidGenerator,
      useClass: CryptoUuidGenerator,
    },
  ],
})
export class LeadsModule {}
