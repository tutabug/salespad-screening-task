import { Module } from '@nestjs/common';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { LeadRepository } from './domain/repositories/lead.repository';
import { PostgresLeadRepository } from './infrastructure/repositories/postgres-lead.repository';
import { LeadsController } from './presentation/controllers/leads.controller';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';

@Module({
  imports: [DatabaseModule],
  controllers: [LeadsController],
  providers: [
    CreateLeadUseCase,
    {
      provide: LeadRepository,
      useClass: PostgresLeadRepository,
    },
    {
      provide: UuidGenerator,
      useClass: CryptoUuidGenerator,
    },
  ],
})
export class LeadsModule {}
