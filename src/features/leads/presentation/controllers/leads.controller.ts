import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateLeadDto } from '../../application/dtos/create-lead.dto';
import { LeadResponseDto } from '../../application/dtos/lead-response.dto';
import { CreateLeadUseCase } from '../../application/use-cases/create-lead.use-case';

@ApiTags('leads')
@Controller('lead')
export class LeadsController {
  constructor(private readonly createLeadUseCase: CreateLeadUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead created successfully', type: LeadResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateLeadDto): Promise<LeadResponseDto> {
    return this.createLeadUseCase.execute(dto);
  }
}
