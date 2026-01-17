import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadEventType } from '../../domain/entities/lead-event.entity';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { AddLeadInput, LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadStatus as PrismaLeadStatus } from '@prisma/client';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class PrismaLeadRepository extends LeadRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super();
  }

  async addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }> {
    const { lead, correlationIds } = input;
    const leadId = this.uuidGenerator.generate();
    const eventId = this.uuidGenerator.generate();

    const [createdLead, createdEvent] = await this.prisma.$transaction(async (tx) => {
      const leadRecord = await tx.lead.create({
        data: {
          uuid: leadId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: LeadStatus.NEW as PrismaLeadStatus,
        },
      });

      const eventRecord = await tx.leadEvent.create({
        data: {
          uuid: eventId,
          type: LeadEventType.LEAD_ADDED,
          correlationIds: { ...correlationIds, leadId },
          payload: { ...lead, id: leadId, status: LeadStatus.NEW } as object,
          leadId: leadRecord.id,
        },
      });

      return [leadRecord, eventRecord] as const;
    });

    return {
      lead: this.toDomain(createdLead),
      event: new LeadAddedEvent(
        createdEvent.uuid,
        leadId,
        createdEvent.correlationIds as Record<string, string>,
        { ...lead, id: leadId, status: LeadStatus.NEW },
        createdEvent.createdAt,
      ),
    };
  }

  private toDomain(record: {
    uuid: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: PrismaLeadStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Lead {
    return new Lead(
      record.uuid,
      record.name,
      record.email,
      record.phone,
      record.status as LeadStatus,
      record.createdAt,
      record.updatedAt,
    );
  }
}
