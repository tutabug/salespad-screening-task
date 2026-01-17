import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './shared/config/env.validation';
import { DatabaseModule } from './shared/infrastructure/database';
import { LeadsModule } from './features/leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    LeadsModule,
  ],
})
export class AppModule {}
