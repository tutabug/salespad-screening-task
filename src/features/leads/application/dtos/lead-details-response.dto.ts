import { ApiProperty } from '@nestjs/swagger';
import { Message, MessageChannel } from '@/shared/domain';
import { LeadEvent } from '../../domain/entities/lead-event.entity';

export type MessagesByChannel = {
  [K in MessageChannel]?: Message<K>[];
};

export class LeadDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LeadDetailsResponseDto {
  @ApiProperty({ type: LeadDto })
  lead: LeadDto;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'object' } } })
  messagesByChannel: MessagesByChannel;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  events: LeadEvent<unknown>[];
}
