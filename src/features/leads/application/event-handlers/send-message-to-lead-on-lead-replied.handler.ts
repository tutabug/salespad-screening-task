import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import { MessageSentToLeadReplyEvent } from '../../domain/events/message-sent-to-lead-reply.event';
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
    private readonly eventEmitter: EventEmitter2,
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

    const { savedMessage, event: messageSentEvent } =
      await this.messageRepository.saveMessageSentToLeadReply({
        message: aiReplyMessage,
        leadId: event.payload.lead.id,
        replyToMessageId: event.payload.leadMessage.id,
        correlationIds: { ...event.correlationIds, triggeredByEventId: event.id },
      });

    this.eventEmitter.emit(MessageSentToLeadReplyEvent.eventName, messageSentEvent);

    const command = new SendMessageCommand(
      this.uuidGenerator.generate(),
      { ...event.correlationIds, triggeredByEventId: event.id, leadId: event.payload.lead.id },
      savedMessage.message,
    );

    await this.commandBus.send(command);
  }
}
