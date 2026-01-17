import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { validate } from './shared/config/env.validation';
import { LeadsModule } from './features/leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    LeadsModule,
  ],
})
export class AppModule {}
