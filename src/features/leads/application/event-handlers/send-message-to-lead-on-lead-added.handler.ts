import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { DefaultMessagesGenerator } from '../services/message-generator';
import { MessageRepository, SavedMessage } from '../../domain/repositories/message.repository';
import { SendMessageCommand } from '../commands/send-message.command';
import { CommandBus } from '@/shared/infrastructure/commands';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class SendMessageToLeadOnLeadAddedHandler {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly uuidGenerator: UuidGenerator,
    private readonly messageGenerator: DefaultMessagesGenerator,
    private readonly messageRepository: MessageRepository,
  ) {}

  @OnEvent(LeadAddedEvent.eventName)
  async handle(event: LeadAddedEvent): Promise<void> {
    const messages = await this.messageGenerator.generate(event);

    const savedMessages = await this.messageRepository.saveAll({
      messages,
      leadId: event.leadId,
    });

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
          { ...event.correlationIds, eventId: event.id, leadId: event.leadId },
          saved.message,
        ),
    );
  }
}
