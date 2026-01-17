import {
  MessageRepository,
  SaveMessagesInput,
  SaveMessageSentToLeadReplyInput,
  SavedMessage,
  GetMessagesForLeadInput,
} from '../../domain/repositories/message.repository';
import { Message } from '@/shared/domain';
import { LeadMessagesSentEvent } from '../../domain/events/lead-messages-sent.event';
import { MessageSentToLeadReplyEvent } from '../../domain/events/message-sent-to-lead-reply.event';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

export class FakeMessageRepository extends MessageRepository {
  private savedMessages: SavedMessage[] = [];
  private uuidGenerator: UuidGenerator;

  constructor(uuidGenerator: UuidGenerator) {
    super();
    this.uuidGenerator = uuidGenerator;
  }

  async saveMessagesSent(
    input: SaveMessagesInput,
  ): Promise<{ savedMessages: SavedMessage[]; event: LeadMessagesSentEvent }> {
    const results: SavedMessage[] = input.messages.map((message) => ({
      id: message.id,
      leadId: input.leadId,
      message,
    }));
    this.savedMessages.push(...results);

    const messageIds = results.map((r) => r.id);
    const eventId = this.uuidGenerator.generate();
    const event = new LeadMessagesSentEvent(
      eventId,
      input.leadId,
      input.correlationIds,
      { leadId: input.leadId, messageIds },
      new Date(),
    );

    return { savedMessages: results, event };
  }

  async saveMessageSentToLeadReply(
    input: SaveMessageSentToLeadReplyInput,
  ): Promise<{ savedMessage: SavedMessage; event: MessageSentToLeadReplyEvent }> {
    const savedMessage: SavedMessage = {
      id: input.message.id,
      leadId: input.leadId,
      message: input.message,
    };
    this.savedMessages.push(savedMessage);

    const eventId = this.uuidGenerator.generate();
    const event = new MessageSentToLeadReplyEvent(
      eventId,
      input.leadId,
      input.correlationIds,
      {
        leadId: input.leadId,
        messageId: input.message.id,
        replyToMessageId: input.replyToMessageId,
      },
      new Date(),
    );

    return { savedMessage, event };
  }

  async getMessagesForLead(input: GetMessagesForLeadInput): Promise<Message[]> {
    return this.savedMessages
      .filter((saved) => saved.leadId === input.leadId)
      .map((saved) => saved.message)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getSavedMessages(): SavedMessage[] {
    return [...this.savedMessages];
  }

  getLastSavedMessage(): SavedMessage | undefined {
    return this.savedMessages[this.savedMessages.length - 1];
  }

  reset(): void {
    this.savedMessages = [];
  }
}
