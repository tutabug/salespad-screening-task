import { Message } from '@/shared/domain';
import { LeadAddedEvent } from '../events/lead-added.event';

export abstract class MessageGenerator {
  abstract generate(event: LeadAddedEvent): Promise<Message[]>;
}
