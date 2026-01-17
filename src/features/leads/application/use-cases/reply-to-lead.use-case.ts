import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UuidGenerator } from '@/shared/infrastructure/uuid';
import { Message } from '@/shared/domain';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadRepliedEvent } from '../../domain/events/lead-replied.event';
import { ReplyLeadDto } from '../dtos/reply-lead.dto';

@Injectable()
export class ReplyToLeadUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly uuidGenerator: UuidGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(leadId: string, dto: ReplyLeadDto): Promise<{ messageId: string }> {
    const replyMessage = new Message(
      this.uuidGenerator.generate(),
      dto.channel,
      dto.messageContent,
    );

    const { event } = await this.leadRepository.saveLeadReplayed({
      leadId,
      leadMessage: replyMessage,
      correlationIds: { replyId: this.uuidGenerator.generate() },
    });

    this.eventEmitter.emit(LeadRepliedEvent.eventName, event);

    return { messageId: replyMessage.id };
  }
}
