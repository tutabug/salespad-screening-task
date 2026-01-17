import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadEvent } from '../../domain/entities/lead-event.entity';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import {
  LeadRepository,
  AddLeadInput,
  ReplyToLeadInput,
  GetLeadByIdInput,
  GetEventsForLeadInput,
} from '../../domain/repositories/lead.repository';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

export class FakeLeadRepository extends LeadRepository {
  private leads: Lead[] = [];
  private events: LeadEvent<unknown>[] = [];
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

    this.events.push(event);

    return { lead, event };
  }

  async saveLeadReplayed(
    input: ReplyToLeadInput,
  ): Promise<{ lead: Lead; event: LeadRepliedEvent }> {
    const leadIndex = this.leads.findIndex((l) => l.id === input.leadId);
    if (leadIndex === -1) {
      throw new Error(`Lead not found: ${input.leadId}`);
    }

    const now = new Date();
    const existingLead = this.leads[leadIndex];
    const updatedLead = new Lead(
      existingLead.id,
      existingLead.name,
      existingLead.email,
      existingLead.phone,
      LeadStatus.REPLIED,
      existingLead.createdAt,
      now,
    );

    this.leads[leadIndex] = updatedLead;

    const event = new LeadRepliedEvent(
      this.uuidGenerator.generate(),
      updatedLead,
      input.correlationIds,
      { lead: updatedLead, leadMessage: input.leadMessage },
      now,
    );

    this.events.push(event);

    return { lead: updatedLead, event };
  }

  async getLeadById(input: GetLeadByIdInput): Promise<Lead> {
    const lead = this.leads.find((l) => l.id === input.leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${input.leadId}`);
    }
    return lead;
  }

  async getEventsForLead(input: GetEventsForLeadInput): Promise<LeadEvent<unknown>[]> {
    return this.events
      .filter((e) => e.leadId === input.leadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getAll(): Lead[] {
    return [...this.leads];
  }

  reset(): void {
    this.leads = [];
    this.events = [];
  }
}
