import { LeadEvent, LeadEventType } from '../entities/lead-event.entity';

export interface LeadMessagesSentPayload {
  leadId: string;
  messageIds: string[];
}

export class LeadMessagesSentEvent extends LeadEvent<LeadMessagesSentPayload> {
  static readonly eventName = 'lead.messages.sent' as const;

  constructor(
    id: string,
    leadId: string,
    correlationIds: Record<string, string>,
    payload: LeadMessagesSentPayload,
    createdAt: Date,
  ) {
    super(id, LeadEventType.MESSAGE_SENT, leadId, correlationIds, payload, createdAt);
  }
}
