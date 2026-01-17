import { LeadEvent, LeadEventType } from '../entities/lead-event.entity';
import { LeadData } from '../repositories/lead.repository';

export type LeadAddedPayload = LeadData & { id: string; status: string };

export class LeadAddedEvent extends LeadEvent<LeadAddedPayload> {
  static readonly eventName = 'lead.added' as const;

  constructor(
    id: string,
    leadId: string,
    correlationIds: Record<string, string>,
    payload: LeadAddedPayload,
    createdAt: Date,
  ) {
    super(id, LeadEventType.LEAD_ADDED, leadId, correlationIds, payload, createdAt);
  }
}
