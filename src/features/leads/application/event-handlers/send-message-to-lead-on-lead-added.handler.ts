import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { SendMessageCommand } from '../commands/send-message.command';
import { CommandBus } from '@/shared/infrastructure/commands';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class SendMessageToLeadOnLeadAddedHandler {
  private static readonly WELCOME_MESSAGE =
    'Hi! Thanks for your interest. We would love to learn more about your needs.';

  constructor(
    private readonly commandBus: CommandBus,
    private readonly uuidGenerator: UuidGenerator,
  ) {}

  @OnEvent(LeadAddedEvent.eventName)
  async handle(event: LeadAddedEvent): Promise<void> {
    const command = new SendMessageCommand(
      this.uuidGenerator.generate(),
      { ...event.correlationIds, eventId: event.id },
      {
        leadId: event.leadId,
        leadName: event.payload.name,
        leadEmail: event.payload.email,
        leadPhone: event.payload.phone,
        message: SendMessageToLeadOnLeadAddedHandler.WELCOME_MESSAGE,
      },
    );

    await this.commandBus.send(command);
  }
}
