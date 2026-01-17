import { Message } from '@/shared/domain';

export interface SaveMessagesInput {
  messages: Message[];
  leadId: string;
}

export interface SavedMessage {
  id: string;
  leadId: string;
  message: Message;
}

export abstract class MessageRepository {
  abstract saveAll(input: SaveMessagesInput): Promise<SavedMessage[]>;
}
