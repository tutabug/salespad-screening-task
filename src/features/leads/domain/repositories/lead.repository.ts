import { Lead } from '../entities/lead.entity';
import { LeadEvent } from '../entities/lead-event.entity';

export type LeadData = Omit<Lead, 'createdAt' | 'updatedAt'>;

export abstract class LeadRepository {
  abstract create(lead: LeadData): Promise<Lead>;

  abstract createWithEvent<T = LeadData>(
    lead: LeadData,
    event: Omit<LeadEvent<T>, 'createdAt'>,
  ): Promise<{ lead: Lead; event: LeadEvent<T> }>;
}
