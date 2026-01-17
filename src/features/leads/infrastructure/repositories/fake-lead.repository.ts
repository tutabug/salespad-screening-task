import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { LeadRepository, AddLeadInput } from '../../domain/repositories/lead.repository';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

export class FakeLeadRepository extends LeadRepository {
  private leads: Lead[] = [];
  private uuidGenerator: UuidGenerator;

  constructor(uuidGenerator: UuidGenerator) {
    super();
    this.uuidGenerator = uuidGenerator;
  }

  async addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }> {
    const now = new Date();
    const lead = new Lead(
      this.uuidGenerator.generate(),
      input.lead.name,
      input.lead.email ?? null,
      input.lead.phone ?? null,
      LeadStatus.NEW,
      now,
      now,
    );

    this.leads.push(lead);

    const event = new LeadAddedEvent(
      this.uuidGenerator.generate(),
      lead.id,
      input.correlationIds,
      {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
      },
      now,
    );

    return { lead, event };
  }

  getAll(): Lead[] {
    return [...this.leads];
  }

  reset(): void {
    this.leads = [];
  }
}
