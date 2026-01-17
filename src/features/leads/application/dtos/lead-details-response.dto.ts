import { ApiProperty } from '@nestjs/swagger';
import { Message } from '@/shared/domain';
import { LeadEvent } from '../../domain/entities/lead-event.entity';

export class LeadDetailsResponseDto {
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

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  messages: Message[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  events: LeadEvent<unknown>[];
}
