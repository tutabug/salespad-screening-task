import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Lead, LeadStatus } from '../../domain/entities/lead.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';

interface LeadRow {
  id: number;
  uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresLeadRepository extends LeadRepository {
  constructor(private readonly pool: Pool) {
    super();
  }

  async create(lead: Omit<Lead, 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const query = `
      INSERT INTO leads (uuid, name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, uuid, name, email, phone, status, created_at, updated_at
    `;

    const values = [lead.id, lead.name, lead.email, lead.phone, lead.status];

    const result = await this.pool.query<LeadRow>(query, values);
    return this.toDomain(result.rows[0]);
  }

  private toDomain(row: LeadRow): Lead {
    return new Lead(
      row.uuid,
      row.name,
      row.email,
      row.phone,
      row.status as LeadStatus,
      row.created_at,
      row.updated_at,
    );
  }
}
