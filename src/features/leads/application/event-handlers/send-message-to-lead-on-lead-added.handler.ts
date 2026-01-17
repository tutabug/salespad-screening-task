import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { DefaultMessagesGenerator } from '../services/message-generator';
import { MessageRepository, SavedMessage } from '../../domain/repositories/message.repository';
import { SendMessageCommand } from '../commands/send-message.command';
import { CommandBus } from '@/shared/infrastructure/commands';
import { UuidGenerator } from '@/shared/infrastructure/uuid';
import { LeadMessagesSentEvent } from '../../domain/events/lead-messages-sent.event';

@Injectable()
export class SendMessageToLeadOnLeadAddedHandler {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly uuidGenerator: UuidGenerator,
    private readonly messageGenerator: DefaultMessagesGenerator,
    private readonly messageRepository: MessageRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(LeadAddedEvent.eventName)
  async handle(event: LeadAddedEvent): Promise<void> {
    const messages = await this.messageGenerator.generate(event);

    const { savedMessages, event: messagesSentEvent } =
      await this.messageRepository.saveMessagesSent({
        messages,
        leadId: event.leadId,
        correlationIds: { ...event.correlationIds, eventId: this.uuidGenerator.generate() },
      });

    this.eventEmitter.emit(LeadMessagesSentEvent.eventName, messagesSentEvent);

    const commands = this.createSendMessageCommands(savedMessages, event);

    await Promise.all(commands.map((command) => this.commandBus.send(command)));
  }

  private createSendMessageCommands(
    savedMessages: SavedMessage[],
    event: LeadAddedEvent,
  ): SendMessageCommand[] {
    return savedMessages.map(
      (saved) =>
        new SendMessageCommand(
          this.uuidGenerator.generate(),
          { ...event.correlationIds, triggeredByEventId: event.id, leadId: event.leadId },
          saved.message,
        ),
    );
  }
}
