import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'nestjs-prisma';
import { validate } from './shared/config/env.validation';
import { LeadsModule } from './features/leads/leads.module';
import {
  CommandBus,
  BullMqCommandBus,
  COMMAND_QUEUE_NAME,
} from './shared/infrastructure/commands';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue({
      name: COMMAND_QUEUE_NAME,
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    LeadsModule,
  ],
  providers: [
    {
      provide: CommandBus,
      useClass: BullMqCommandBus,
    },
  ],
  exports: [CommandBus],
})
export class AppModule {}
