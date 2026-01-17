import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadStatus as PrismaLeadStatus } from '@prisma/client';

@Injectable()
export class PrismaLeadRepository extends LeadRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(lead: Omit<Lead, 'createdAt' | 'updatedAt'>): Promise<Lead> {
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
