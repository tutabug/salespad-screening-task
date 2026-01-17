import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import { DefaultChannelContentGeneratorRegistry } from '../services/channel-content-generator-registry';
import { MessageRepository } from '../../domain/repositories/message.repository';
import { SendMessageCommand } from '../commands/send-message.command';
import { CommandBus } from '@/shared/infrastructure/commands';
import { UuidGenerator } from '@/shared/infrastructure/uuid';
import { Message } from '@/shared/domain';

@Injectable()
export class SendMessageToLeadOnLeadRepliedHandler {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly uuidGenerator: UuidGenerator,
    private readonly contentGeneratorRegistry: DefaultChannelContentGeneratorRegistry,
    private readonly messageRepository: MessageRepository,
  ) {}

  @OnEvent(LeadRepliedEvent.eventName)
  async handle(event: LeadRepliedEvent): Promise<void> {
    const previousMessages = await this.messageRepository.getMessagesForLead({
      leadId: event.payload.lead.id,
    });

    const generator = this.contentGeneratorRegistry.get(event.payload.leadMessage.channel);
    if (!generator) {
      throw new Error(
        `No content generator registered for channel: ${event.payload.leadMessage.channel}`,
      );
    }

    const replayToLeadChannelMessage = await generator.generateForLeadReplied(
      event,
      previousMessages,
    );

    const aiReplyMessage = new Message(
      this.uuidGenerator.generate(),
      event.payload.leadMessage.channel,
      replayToLeadChannelMessage,
    );

    const [savedMessage] = await this.messageRepository.saveAll({
      messages: [aiReplyMessage],
      leadId: event.payload.lead.id,
    });

    const command = new SendMessageCommand(
      this.uuidGenerator.generate(),
      { ...event.correlationIds, eventId: event.id, leadId: event.payload.lead.id },
      savedMessage.message,
    );

    await this.commandBus.send(command);
  }
}
