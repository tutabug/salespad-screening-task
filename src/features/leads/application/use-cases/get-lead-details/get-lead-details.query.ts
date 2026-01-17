import { LeadDetailsResponseDto } from '../../dtos/lead-details-response.dto';

export interface GetLeadDetailsQueryInput {
  leadId: string;
}

export abstract class GetLeadDetailsQuery {
  abstract execute(input: GetLeadDetailsQueryInput): Promise<LeadDetailsResponseDto>;
}
