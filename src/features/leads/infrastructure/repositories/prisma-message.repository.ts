import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  MessageRepository,
  SaveMessagesInput,
  SaveMessageSentToLeadReplyInput,
  SavedMessage,
  GetMessagesForLeadInput,
} from '../../domain/repositories/message.repository';
import { Message, ChannelMessageMap, MessageChannel } from '@/shared/domain';
import { MessageChannel as PrismaMessageChannel } from '@prisma/client';
import { LeadMessagesSentEvent } from '../../domain/events/lead-messages-sent.event';
import { MessageSentToLeadReplyEvent } from '../../domain/events/message-sent-to-lead-reply.event';
import { LeadEventType } from '../../domain/entities/lead-event.entity';
import { UuidGenerator } from '@/shared/infrastructure/uuid';

@Injectable()
export class PrismaMessageRepository extends MessageRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super();
  }

  async saveMessagesSent(
    input: SaveMessagesInput,
  ): Promise<{ savedMessages: SavedMessage[]; event: LeadMessagesSentEvent }> {
    if (input.messages.length === 0) {
      const eventId = this.uuidGenerator.generate();
      const event = new LeadMessagesSentEvent(
        eventId,
        input.leadId,
        input.correlationIds,
        { leadId: input.leadId, messageIds: [] },
        new Date(),
      );
      return { savedMessages: [], event };
    }

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({
        where: { uuid: input.leadId },
        select: { id: true },
      });

      const savedMessages: SavedMessage[] = [];
      const messageIds: string[] = [];

      for (const message of input.messages) {
        const created = await tx.message.create({
          data: {
            uuid: message.id,
            channel: this.mapChannelToPrisma(message.channel),
            channelMessage: message.channelMessage as object,
            leadId: lead.id,
            createdAt: message.createdAt,
          },
        });

        messageIds.push(created.uuid);
        savedMessages.push({
          id: created.uuid,
          leadId: input.leadId,
          message: new Message(
            created.uuid,
            this.mapChannelFromPrisma(created.channel),
            created.channelMessage as unknown as ChannelMessageMap[MessageChannel],
            created.createdAt,
          ),
        });
      }

      const eventId = this.uuidGenerator.generate();
      const eventRecord = await tx.leadEvent.create({
        data: {
          uuid: eventId,
          type: LeadEventType.MESSAGE_SENT,
          correlationIds: input.correlationIds as object,
          payload: { leadId: input.leadId, messageIds } as object,
          leadId: lead.id,
        },
      });

      const event = new LeadMessagesSentEvent(
        eventRecord.uuid,
        input.leadId,
        eventRecord.correlationIds as Record<string, string>,
        { leadId: input.leadId, messageIds },
        eventRecord.createdAt,
      );

      return { savedMessages, event };
    });
  }

  async saveMessageSentToLeadReply(
    input: SaveMessageSentToLeadReplyInput,
  ): Promise<{ savedMessage: SavedMessage; event: MessageSentToLeadReplyEvent }> {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({
        where: { uuid: input.leadId },
        select: { id: true },
      });

      const created = await tx.message.create({
        data: {
          uuid: input.message.id,
          channel: this.mapChannelToPrisma(input.message.channel),
          channelMessage: input.message.channelMessage as object,
          leadId: lead.id,
          createdAt: input.message.createdAt,
        },
      });

      const eventId = this.uuidGenerator.generate();
      const eventRecord = await tx.leadEvent.create({
        data: {
          uuid: eventId,
          type: LeadEventType.MESSAGE_SENT,
          correlationIds: input.correlationIds as object,
          payload: {
            leadId: input.leadId,
            messageId: created.uuid,
            replyToMessageId: input.replyToMessageId,
          } as object,
          leadId: lead.id,
        },
      });

      const savedMessage: SavedMessage = {
        id: created.uuid,
        leadId: input.leadId,
        message: new Message(
          created.uuid,
          this.mapChannelFromPrisma(created.channel),
          created.channelMessage as unknown as ChannelMessageMap[MessageChannel],
          created.createdAt,
        ),
      };

      const event = new MessageSentToLeadReplyEvent(
        eventRecord.uuid,
        input.leadId,
        eventRecord.correlationIds as Record<string, string>,
        {
          leadId: input.leadId,
          messageId: created.uuid,
          replyToMessageId: input.replyToMessageId,
        },
        eventRecord.createdAt,
      );

      return { savedMessage, event };
    });
  }

  async getMessagesForLead(input: GetMessagesForLeadInput): Promise<Message[]> {
    const lead = await this.prisma.lead.findUniqueOrThrow({
      where: { uuid: input.leadId },
      select: { id: true },
    });

    const messages = await this.prisma.message.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(
      (msg) =>
        new Message(
          msg.uuid,
          this.mapChannelFromPrisma(msg.channel),
          msg.channelMessage as unknown as ChannelMessageMap[MessageChannel],
          msg.createdAt,
        ),
    );
  }

  private mapChannelToPrisma(channel: MessageChannel): PrismaMessageChannel {
    const mapping: Record<MessageChannel, PrismaMessageChannel> = {
      [MessageChannel.EMAIL]: PrismaMessageChannel.email,
      [MessageChannel.WHATSAPP]: PrismaMessageChannel.whatsapp,
      [MessageChannel.LINKEDIN]: PrismaMessageChannel.linkedin,
      [MessageChannel.VOICE]: PrismaMessageChannel.voice,
      [MessageChannel.ADS]: PrismaMessageChannel.ads,
    };
    return mapping[channel];
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
}
