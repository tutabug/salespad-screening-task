import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { GetLeadDetailsQuery, GetLeadDetailsQueryInput } from './get-lead-details.query';
import { LeadDetailsResponseDto, MessagesByChannel } from '../../dtos/lead-details-response.dto';
import { LeadStatus } from '../../../domain/entities/lead.entity';
import { LeadEvent, LeadEventType } from '../../../domain/entities/lead-event.entity';
import { Message, MessageChannel, ChannelMessageMap } from '@/shared/domain';
import { MessageChannel as PrismaMessageChannel, LeadStatus as PrismaLeadStatus } from '@prisma/client';

@Injectable()
export class PrismaGetLeadDetailsQuery extends GetLeadDetailsQuery {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(input: GetLeadDetailsQueryInput): Promise<LeadDetailsResponseDto> {
    const leadRecord = await this.prisma.lead.findUnique({
      where: { uuid: input.leadId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!leadRecord) {
      throw new Error(`Lead not found: ${input.leadId}`);
    }

    const messagesByChannel: MessagesByChannel = {};

    for (const msg of leadRecord.messages) {
      const channel = this.mapChannelFromPrisma(msg.channel);
      const message = new Message(
        msg.uuid,
        channel,
        msg.channelMessage as unknown as ChannelMessageMap[typeof channel],
        msg.createdAt,
      );

      if (!messagesByChannel[channel]) {
        messagesByChannel[channel] = [];
      }
      (messagesByChannel[channel] as Message[]).push(message);
    }

    const events = leadRecord.events.map(
      (event) =>
        new LeadEvent(
          event.uuid,
          event.type as LeadEventType,
          input.leadId,
          event.correlationIds as Record<string, string>,
          event.payload as unknown,
          event.createdAt,
        ),
    );

    return {
      lead: {
        id: leadRecord.uuid,
        name: leadRecord.name,
        email: leadRecord.email,
        phone: leadRecord.phone,
        status: this.mapStatusFromPrisma(leadRecord.status),
        createdAt: leadRecord.createdAt,
        updatedAt: leadRecord.updatedAt,
      },
      messagesByChannel,
      events,
    };
  }

  private mapChannelFromPrisma(channel: PrismaMessageChannel): MessageChannel {
    const mapping: Record<PrismaMessageChannel, MessageChannel> = {
      [PrismaMessageChannel.email]: MessageChannel.EMAIL,
      [PrismaMessageChannel.whatsapp]: MessageChannel.WHATSAPP,
      [PrismaMessageChannel.linkedin]: MessageChannel.LINKEDIN,
      [PrismaMessageChannel.voice]: MessageChannel.VOICE,
      [PrismaMessageChannel.ads]: MessageChannel.ADS,
    };
    return mapping[channel];
  }

  private mapStatusFromPrisma(status: PrismaLeadStatus): LeadStatus {
    return status as LeadStatus;
  }
}
