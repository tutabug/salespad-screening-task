import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { COMMAND_QUEUE_NAME } from '@/shared/infrastructure/commands';
import { MessageSenderRegistry } from '../../domain/services/message-sender-registry';
import { MessageChannel, ChannelMessageMap } from '@/shared/domain';

interface SendMessageJobData {
  id: string;
  correlationIds: Record<string, string>;
  payload: {
    id: string;
    channel: MessageChannel;
    channelMessage: ChannelMessageMap[MessageChannel];
    createdAt: string;
  };
  createdAt: string;
}

@Processor(COMMAND_QUEUE_NAME)
export class SendMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(SendMessageProcessor.name);

  constructor(private readonly senderRegistry: MessageSenderRegistry) {
    super();
  }

  async process(job: Job<SendMessageJobData>): Promise<void> {
    if (job.name !== 'send-message') {
      this.logger.warn(`Unknown job name: ${job.name}, skipping`);
      return;
    }

    const { id, correlationIds, payload } = job.data;

    this.logger.log(
      `Processing SendMessageCommand [id=${id}, leadId=${correlationIds.leadId}, channel=${payload.channel}]`,
    );

    const sender = this.senderRegistry.get(payload.channel);

    if (!sender) {
      throw new Error(`No sender registered for channel: ${payload.channel}`);
    }

    await sender.send(payload.channelMessage);

    this.logger.log(`SendMessageCommand processed successfully [id=${id}]`);
  }
}
