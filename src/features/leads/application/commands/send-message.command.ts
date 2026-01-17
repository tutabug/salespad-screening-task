import { Command } from '@/shared/infrastructure/commands';

export interface SendMessagePayload {
  leadId: string;
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  message: string;
}

export class SendMessageCommand extends Command<SendMessagePayload> {
  readonly name = 'send-message';

  constructor(id: string, correlationIds: Record<string, string>, payload: SendMessagePayload) {
    super(id, correlationIds, payload);
  }
}
