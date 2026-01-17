import { Lead } from '../entities/lead.entity';
import { LeadAddedEvent } from '../events/lead-added.event';

export type LeadData = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

export type LeadAddedPayload = LeadData & { id: string; status: string };

export interface AddLeadInput {
  lead: LeadData;
  correlationIds: Record<string, string>;
}

export abstract class LeadRepository {
  abstract addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }>;
}
