import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  MessageRepository,
  SaveMessagesInput,
  SavedMessage,
  GetMessagesForLeadInput,
} from '../../domain/repositories/message.repository';
import { Message, ChannelMessageMap, MessageChannel } from '@/shared/domain';
import { MessageChannel as PrismaMessageChannel } from '@prisma/client';

@Injectable()
export class PrismaMessageRepository extends MessageRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async saveAll(input: SaveMessagesInput): Promise<SavedMessage[]> {
    if (input.messages.length === 0) {
      return [];
    }

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUniqueOrThrow({
        where: { uuid: input.leadId },
        select: { id: true },
      });

      const savedMessages: SavedMessage[] = [];

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

      return savedMessages;
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
