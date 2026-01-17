import { Injectable } from '@nestjs/common';
import { Lead } from '../../domain/entities/lead.entity';
import { LeadEvent, LeadEventType } from '../../domain/entities/lead-event.entity';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { CreateLeadDto } from '../dtos/create-lead.dto';
import { LeadResponseDto } from '../dtos/lead-response.dto';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly uuidGenerator: UuidGenerator,
  ) {}

  async execute(dto: CreateLeadDto): Promise<LeadResponseDto> {
    const leadId = this.uuidGenerator.generate();
    const eventId = this.uuidGenerator.generate();

    const leadData = Lead.create({
      id: leadId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    const eventData = LeadEvent.create<Omit<Lead, 'createdAt' | 'updatedAt'>>({
      id: eventId,
      type: LeadEventType.LEAD_ADDED,
      leadId: leadId,
      correlationIds: { leadId },
      payload: leadData,
    });

    const { lead } = await this.leadRepository.createWithEvent(leadData, eventData);

    return this.toResponse(lead);
  }

  private toResponse(lead: Lead): LeadResponseDto {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }
}
