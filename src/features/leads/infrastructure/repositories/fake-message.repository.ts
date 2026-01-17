import {
  MessageRepository,
  SaveMessagesInput,
  SavedMessage,
  GetMessagesForLeadInput,
} from '../../domain/repositories/message.repository';
import { Message } from '@/shared/domain';

export class FakeMessageRepository extends MessageRepository {
  private savedMessages: SavedMessage[] = [];

  async saveAll(input: SaveMessagesInput): Promise<SavedMessage[]> {
    const results: SavedMessage[] = input.messages.map((message) => ({
      id: message.id,
      leadId: input.leadId,
      message,
    }));
    this.savedMessages.push(...results);
    return results;
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
