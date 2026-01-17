import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead } from '../../domain/entities/lead.entity';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { CreateLeadDto } from '../dtos/create-lead.dto';
import { LeadResponseDto } from '../dtos/lead-response.dto';

@Injectable()
export class AddLeadUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateLeadDto): Promise<LeadResponseDto> {
    const { lead, event } = await this.leadRepository.addLead({
      lead: {
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
      },
      correlationIds: {},
    });

    this.eventEmitter.emit(LeadAddedEvent.eventName, event);

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
