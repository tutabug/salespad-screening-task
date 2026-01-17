import { Message } from '../entities/message.entity';
import { LeadAddedEvent } from '../events/lead-added.event';

export abstract class MessageGenerator {
  abstract generate(event: LeadAddedEvent): Message[];
}
