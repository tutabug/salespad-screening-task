import { Test, TestingModule } from '@nestjs/testing';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { SendMessageToLeadOnLeadAddedHandler } from './send-message-to-lead-on-lead-added.handler';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { BullMqCommandBus, CommandBus, COMMAND_QUEUE_NAME } from '@/shared/infrastructure/commands';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';

describe('SendMessageToLeadOnLeadAddedHandler (Integration)', () => {
  let module: TestingModule;
  let container: StartedRedisContainer;
  let eventEmitter: EventEmitter2;
  let commandQueue: Queue;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();

    const redisUrl = container.getConnectionUrl();

    module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        BullModule.forRoot({
          connection: {
            host: container.getHost(),
            port: container.getPort(),
          },
        }),
        BullModule.registerQueue({
          name: COMMAND_QUEUE_NAME,
        }),
      ],
      providers: [
        SendMessageToLeadOnLeadAddedHandler,
        {
          provide: UuidGenerator,
          useClass: CryptoUuidGenerator,
        },
        {
          provide: CommandBus,
          useClass: BullMqCommandBus,
        },
      ],
    }).compile();

    await module.init();

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    commandQueue = module.get<Queue>(getQueueToken(COMMAND_QUEUE_NAME));
  }, 60000);

  afterEach(async () => {
    await commandQueue.drain();
  });

  afterAll(async () => {
    await commandQueue.close();
    await module.close();
    await container.stop();
  });

  describe('when LeadAddedEvent is emitted', () => {
    it('should dispatch SendMessageCommand to BullMQ queue', async () => {
      const event = new LeadAddedEvent(
        'event-123',
        'lead-456',
        { requestId: 'req-789' },
        {
          id: 'lead-456',
          name: 'John Doe',
          email: 'john@example.com',
          phone: null,
          status: 'new',
        },
        new Date('2025-01-17T10:00:00Z'),
      );

      await eventEmitter.emitAsync(LeadAddedEvent.eventName, event);

      // Give BullMQ a moment to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      const jobs = await commandQueue.getJobs(['waiting', 'active', 'completed']);
      expect(jobs).toHaveLength(1);

      const job = jobs[0];
      expect(job.name).toBe('send-message');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(job.data.correlationIds).toEqual({
        requestId: 'req-789',
        eventId: 'event-123',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(job.data.payload).toMatchObject({
        leadId: 'lead-456',
        leadName: 'John Doe',
        leadEmail: 'john@example.com',
        leadPhone: null,
        message: 'Hi! Thanks for your interest. We would love to learn more about your needs.',
      });
    });

    it('should include phone in command payload when lead has phone', async () => {
      const event = new LeadAddedEvent(
        'event-456',
        'lead-789',
        { requestId: 'req-101' },
        {
          id: 'lead-789',
          name: 'Jane Smith',
          email: null,
          phone: '+1234567890',
          status: 'new',
        },
        new Date('2025-01-17T11:00:00Z'),
      );

      await eventEmitter.emitAsync(LeadAddedEvent.eventName, event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const jobs = await commandQueue.getJobs(['waiting', 'active', 'completed']);
      expect(jobs).toHaveLength(1);

      const job = jobs[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(job.data.payload).toMatchObject({
        leadId: 'lead-789',
        leadName: 'Jane Smith',
        leadEmail: null,
        leadPhone: '+1234567890',
      });
    });

    it('should generate unique command ID for each event', async () => {
      const event1 = new LeadAddedEvent(
        'event-1',
        'lead-1',
        { requestId: 'req-1' },
        {
          id: 'lead-1',
          name: 'Lead One',
          email: 'one@example.com',
          phone: null,
          status: 'new',
        },
        new Date(),
      );

      const event2 = new LeadAddedEvent(
        'event-2',
        'lead-2',
        { requestId: 'req-2' },
        {
          id: 'lead-2',
          name: 'Lead Two',
          email: 'two@example.com',
          phone: null,
          status: 'new',
        },
        new Date(),
      );

      await eventEmitter.emitAsync(LeadAddedEvent.eventName, event1);
      await eventEmitter.emitAsync(LeadAddedEvent.eventName, event2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const jobs = await commandQueue.getJobs(['waiting', 'active', 'completed']);
      expect(jobs).toHaveLength(2);

      const commandIds = jobs.map((job) => job.data.id);
      expect(commandIds[0]).not.toBe(commandIds[1]);
    });
  });
});
