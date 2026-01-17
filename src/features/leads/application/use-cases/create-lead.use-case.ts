import { Injectable } from '@nestjs/common';
import { Lead } from '../../domain/entities/lead.entity';
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
    const leadData = Lead.create({
      id: this.uuidGenerator.generate(),
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    const lead = await this.leadRepository.create(leadData);

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
