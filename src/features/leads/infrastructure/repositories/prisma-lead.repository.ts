import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadEvent, LeadEventType } from '../../domain/entities/lead-event.entity';
import { LeadData, LeadRepository } from '../../domain/repositories/lead.repository';
import {
  LeadStatus as PrismaLeadStatus,
  LeadEventType as PrismaLeadEventType,
} from '@prisma/client';

@Injectable()
export class PrismaLeadRepository extends LeadRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(lead: LeadData): Promise<Lead> {
    const created = await this.prisma.lead.create({
      data: {
        uuid: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status as PrismaLeadStatus,
      },
    });

    return this.toDomain(created);
  }

  async createWithEvent<T = LeadData>(
    lead: LeadData,
    event: Omit<LeadEvent<T>, 'createdAt'>,
  ): Promise<{ lead: Lead; event: LeadEvent<T> }> {
    const [createdLead, createdEvent] = await this.prisma.$transaction(async (transaction) => {
      const leadRecord = await transaction.lead.create({
        data: {
          uuid: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status as PrismaLeadStatus,
        },
      });

      const eventRecord = await transaction.leadEvent.create({
        data: {
          uuid: event.id,
          type: event.type as PrismaLeadEventType,
          correlationIds: event.correlationIds,
          payload: event.payload as object,
          leadId: leadRecord.id,
        },
      });

      return [leadRecord, eventRecord] as const;
    });

    return {
      lead: this.toDomain(createdLead),
      event: this.eventToDomain<T>(createdEvent),
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

  private eventToDomain<T>(record: {
    uuid: string;
    type: PrismaLeadEventType;
    correlationIds: unknown;
    payload: unknown;
    createdAt: Date;
  }): LeadEvent<T> {
    return new LeadEvent<T>(
      record.uuid,
      record.type as LeadEventType,
      (record.correlationIds as Record<string, string>).leadId,
      record.correlationIds as Record<string, string>,
      record.payload as T,
      record.createdAt,
    );
  }
}
