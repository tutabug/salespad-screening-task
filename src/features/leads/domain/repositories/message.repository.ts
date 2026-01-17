import { Message } from '../entities/message.entity';

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
