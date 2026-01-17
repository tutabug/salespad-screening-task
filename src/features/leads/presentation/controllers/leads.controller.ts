import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { CreateLeadDto } from '../../application/dtos/create-lead.dto';
import { LeadResponseDto } from '../../application/dtos/lead-response.dto';
import { ReplyLeadDto } from '../../application/dtos/reply-lead.dto';
import { AddLeadUseCase } from '../../application/use-cases/add-lead.use-case';
import { ReplyToLeadUseCase } from '../../application/use-cases/reply-to-lead.use-case';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly createLeadUseCase: AddLeadUseCase,
    private readonly replyToLeadUseCase: ReplyToLeadUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead created successfully', type: LeadResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateLeadDto): Promise<LeadResponseDto> {
    return this.createLeadUseCase.execute(dto);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Handle a reply from a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ type: ReplyLeadDto })
  @ApiResponse({ status: 200, description: 'Reply processed successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async reply(
    @Param('id') leadId: string,
    @Body() dto: ReplyLeadDto,
  ): Promise<{ messageId: string }> {
    return this.replyToLeadUseCase.execute(leadId, dto);
  }
}
