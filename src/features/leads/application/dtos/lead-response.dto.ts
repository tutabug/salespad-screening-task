import { ApiProperty } from '@nestjs/swagger';

export class LeadResponseDto {
  @ApiProperty({ description: 'Lead UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Lead name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Lead email', example: 'john@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Lead phone', example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Lead status', example: 'new' })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
