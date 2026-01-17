import { LeadEvent, LeadEventType } from '../entities/lead-event.entity';

export interface MessageSentToLeadReplyPayload {
  leadId: string;
  messageId: string;
  replyToMessageId: string;
}

export class MessageSentToLeadReplyEvent extends LeadEvent<MessageSentToLeadReplyPayload> {
  static readonly eventName = 'message.sent.to.lead.reply' as const;

  constructor(
    id: string,
    leadId: string,
    correlationIds: Record<string, string>,
    payload: MessageSentToLeadReplyPayload,
    createdAt: Date,
  ) {
    super(id, LeadEventType.MESSAGE_SENT, leadId, correlationIds, payload, createdAt);
  }
}
