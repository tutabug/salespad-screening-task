import { Lead } from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';

export class FakeLeadRepository extends LeadRepository {
  private leads: Lead[] = [];

  async addLead(lead: Lead): Promise<void> {
    const index = this.leads.findIndex((l) => l.id === lead.id);
    if (index >= 0) {
      this.leads[index] = lead;
    } else {
      this.leads.push(lead);
    }
  }

  getAll(): Lead[] {
    return [...this.leads];
  }

  reset(): void {
    this.leads = [];
  }
}
