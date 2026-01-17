import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadEventType } from '../../domain/entities/lead-event.entity';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import {
  AddLeadInput,
  LeadRepository,
  ReplyToLeadInput,
} from '../../domain/repositories/lead.repository';
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

  async replyToLead(input: ReplyToLeadInput): Promise<{ lead: Lead; event: LeadRepliedEvent }> {
    const { leadId, leadMessage, correlationIds } = input;
    const eventId = this.uuidGenerator.generate();

    const [updatedLead, createdEvent, _] = await this.prisma.$transaction(async (tx) => {
      const leadRecord = await tx.lead.findUnique({ where: { uuid: leadId } });
      if (!leadRecord) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      const updated = await tx.lead.update({
        where: { uuid: leadId },
        data: { status: LeadStatus.REPLIED as PrismaLeadStatus },
      });

      const messageRecord = await tx.message.create({
        data: {
          uuid: leadMessage.id,
          channel: leadMessage.channel,
          channelMessage: leadMessage.channelMessage as object,
          leadId: leadRecord.id,
        },
      });

      const payload = { leadId, leadMessage };
      const eventRecord = await tx.leadEvent.create({
        data: {
          uuid: eventId,
          type: LeadEventType.REPLY_RECEIVED,
          correlationIds: { ...correlationIds, leadId },
          payload: payload as object,
          leadId: leadRecord.id,
        },
      });

      return [updated, eventRecord, messageRecord] as const;
    });

    const domainLead = this.toDomain(updatedLead);

    return {
      lead: domainLead,
      event: new LeadRepliedEvent(
        createdEvent.uuid,
        domainLead,
        createdEvent.correlationIds as Record<string, string>,
        { lead: domainLead, leadMessage },
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
