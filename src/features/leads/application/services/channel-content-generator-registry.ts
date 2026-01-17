import { Injectable } from '@nestjs/common';
import { MessageChannel } from '@/shared/domain';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';

interface ChannelMessageContentGenerator {
  readonly channel: MessageChannel;
  generate(event: LeadAddedEvent): Promise<any>;
}

@Injectable()
export class DefaultChannelContentGeneratorRegistry {
  private readonly generators = new Map<MessageChannel, ChannelMessageContentGenerator>();

  register(generator: ChannelMessageContentGenerator): void {
    this.generators.set(generator.channel, generator);
  }

  get(channel: MessageChannel): ChannelMessageContentGenerator | undefined {
    return this.generators.get(channel);
  }
}
