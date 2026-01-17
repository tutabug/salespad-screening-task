import {
  MessageRepository,
  SaveMessagesInput,
  SavedMessage,
} from '../../domain/repositories/message.repository';

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
