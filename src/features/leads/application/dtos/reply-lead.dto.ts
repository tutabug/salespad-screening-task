import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageChannel } from '@/shared/domain';

export class ReplyLeadDto {
  @ApiProperty({
    enum: MessageChannel,
    description: 'The channel through which the lead replied',
    example: MessageChannel.EMAIL,
  })
  @IsEnum(MessageChannel)
  @IsNotEmpty()
  channel!: MessageChannel;

  @ApiProperty({
    description: 'The message content (structure depends on channel)',
    example: { from: 'lead@example.com', subject: 'RE: Welcome', body: 'Thanks for reaching out!' },
  })
  @IsObject()
  @IsNotEmpty()
  messageContent!: any;
}
