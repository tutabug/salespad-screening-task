import { Message } from '@/shared/domain';
import { LeadMessagesSentEvent } from '../events/lead-messages-sent.event';
import { MessageSentToLeadReplyEvent } from '../events/message-sent-to-lead-reply.event';

export interface SaveMessagesInput {
  messages: Message[];
  leadId: string;
  correlationIds: Record<string, string>;
}

export interface SaveMessageSentToLeadReplyInput {
  message: Message;
  leadId: string;
  replyToMessageId: string;
  correlationIds: Record<string, string>;
}

export interface SavedMessage {
  id: string;
  leadId: string;
  message: Message;
}

export interface GetMessagesForLeadInput {
  leadId: string;
}

export abstract class MessageRepository {
  abstract saveMessagesSent(
    input: SaveMessagesInput,
  ): Promise<{ savedMessages: SavedMessage[]; event: LeadMessagesSentEvent }>;
  abstract saveMessageSentToLeadReply(
    input: SaveMessageSentToLeadReplyInput,
  ): Promise<{ savedMessage: SavedMessage; event: MessageSentToLeadReplyEvent }>;
  abstract getMessagesForLead(input: GetMessagesForLeadInput): Promise<Message[]>;
}
