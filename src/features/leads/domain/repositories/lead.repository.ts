import { Lead } from '../entities/lead.entity';
import { LeadAddedEvent } from '../events/lead-added.event';
import { LeadRepliedEvent } from '../events/lead-replied.event';
import { Message } from '@/shared/domain';

export type LeadData = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

export interface AddLeadInput {
  lead: LeadData;
  correlationIds: Record<string, string>;
}

export interface ReplyToLeadInput {
  leadId: string;
  leadMessage: Message;
  correlationIds: Record<string, string>;
}

export abstract class LeadRepository {
  abstract addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }>;
  abstract replyToLead(input: ReplyToLeadInput): Promise<{ lead: Lead; event: LeadRepliedEvent }>;
}
