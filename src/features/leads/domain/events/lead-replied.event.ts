import { LeadEvent, LeadEventType } from '../entities/lead-event.entity';
import { Message, MessageChannel } from '@/shared/domain';
import { Lead } from '../entities/lead.entity';

export interface LeadRepliedPayload {
  lead: Lead;
  leadMessage: Message;
}

export class LeadRepliedEvent extends LeadEvent<LeadRepliedPayload> {
  static readonly eventName = 'lead.replied' as const;

  constructor(
    id: string,
    lead: Lead,
    correlationIds: Record<string, string>,
    payload: LeadRepliedPayload,
    createdAt: Date,
  ) {
    super(id, LeadEventType.REPLY_RECEIVED, lead.id, correlationIds, payload, createdAt);
  }
}
