import { Lead } from '../entities/lead.entity';

export abstract class LeadRepository {
  abstract create(lead: Omit<Lead, 'createdAt' | 'updatedAt'>): Promise<Lead>;
}
