import { Injectable } from '@nestjs/common';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { MessageRepository } from '../../domain/repositories/message.repository';
import { LeadDetailsResponseDto } from '../dtos/lead-details-response.dto';

@Injectable()
export class GetLeadDetailsUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(leadId: string): Promise<LeadDetailsResponseDto> {
    const lead = await this.leadRepository.getLeadById({ leadId });
    const messages = await this.messageRepository.getMessagesForLead({ leadId });
    const events = await this.leadRepository.getEventsForLead({ leadId });

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      messages,
      events,
    };
  }
}
