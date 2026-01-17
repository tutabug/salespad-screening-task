import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { MessageGenerator } from '../../domain/services/message-generator';
import { SendMessageCommand } from '../commands/send-message.command';
import { CommandBus } from '@/shared/infrastructure/commands';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class SendMessageToLeadOnLeadAddedHandler {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly uuidGenerator: UuidGenerator,
    private readonly messageGenerator: MessageGenerator,
  ) {}

  @OnEvent(LeadAddedEvent.eventName)
  async handle(event: LeadAddedEvent): Promise<void> {
    const messages = this.messageGenerator.generate(event);

    const commands = messages.map(
      (message) =>
        new SendMessageCommand(
          this.uuidGenerator.generate(),
          { ...event.correlationIds, eventId: event.id, leadId: event.leadId },
          message,
        ),
    );

    await Promise.all(commands.map((command) => this.commandBus.send(command)));
  }
}
