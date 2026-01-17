import { Test, TestingModule } from '@nestjs/testing';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { SendMessageToLeadOnLeadAddedHandler } from './send-message-to-lead-on-lead-added.handler';
import { LeadAddedEvent } from '../../domain/events/lead-added.event';
import { MessageGenerator } from '../../domain/services/message-generator';
import { MessageRepository } from '../../domain/repositories/message.repository';
import { ChannelResolver } from '../../domain/services/channel-resolver';
import { StaticMessageGenerator } from '../../infrastructure/services/static-message-generator';
import { DefaultChannelResolver } from '../../infrastructure/services/default-channel-resolver';
import { FakeMessageRepository } from '../../infrastructure/repositories/fake-message.repository';
import { BullMqCommandBus, CommandBus, COMMAND_QUEUE_NAME } from '@/shared/infrastructure/commands';
import { CryptoUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';

describe('SendMessageToLeadOnLeadAddedHandler (Integration)', () => {
  let module: TestingModule;
  let container: StartedRedisContainer;
  let eventEmitter: EventEmitter2;
  let commandQueue: Queue;
  let fakeMessageRepository: FakeMessageRepository;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();

    fakeMessageRepository = new FakeMessageRepository();

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
        {
          provide: MessageGenerator,
          useClass: StaticMessageGenerator,
        },
        {
          provide: ChannelResolver,
          useClass: DefaultChannelResolver,
        },
        {
          provide: MessageRepository,
          useValue: fakeMessageRepository,
        },
      ],
    }).compile();

    await module.init();

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    commandQueue = module.get<Queue>(getQueueToken(COMMAND_QUEUE_NAME));
  }, 60000);

  afterEach(async () => {
    await commandQueue.drain();
    fakeMessageRepository.reset();
  });

  afterAll(async () => {
    await commandQueue.close();
    await module.close();
    await container.stop();
  });

  describe('when LeadAddedEvent is emitted', () => {
    it('should dispatch SendMessageCommand to BullMQ queue for email channel', async () => {
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

      await new Promise((resolve) => setTimeout(resolve, 100));

      const jobs = await commandQueue.getJobs(['waiting', 'active', 'completed']);
      expect(jobs).toHaveLength(1);

      const job = jobs[0];
      expect(job.name).toBe('send-message');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(job.data.correlationIds).toEqual({
        requestId: 'req-789',
        eventId: 'event-123',
        leadId: 'lead-456',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(job.data.payload).toMatchObject({
        channel: 'email',
        channelMessage: {
          to: 'john@example.com',
          subject: 'Welcome, John Doe!',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          body: expect.stringContaining('Hi John Doe'),
        },
      });

      // Verify message was saved to repository
      const savedMessages = fakeMessageRepository.getSavedMessages();
      expect(savedMessages).toHaveLength(1);
      expect(savedMessages[0].leadId).toBe('lead-456');
      expect(savedMessages[0].message.channel).toBe('email');
    });

    it('should dispatch WhatsApp command when lead has phone but no email', async () => {
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
      expect(jobs[0].data.payload.channel).toBe('whatsapp');
      expect(jobs[0].data.payload.channelMessage.to).toBe('+1234567890');

      // Verify message was saved
      const savedMessages = fakeMessageRepository.getSavedMessages();
      expect(savedMessages).toHaveLength(1);
      expect(savedMessages[0].message.channel).toBe('whatsapp');
    });

    it('should not dispatch command when lead has no email or phone', async () => {
      const event = new LeadAddedEvent(
        'event-456',
        'lead-789',
        { requestId: 'req-101' },
        {
          id: 'lead-789',
          name: 'Jane Smith',
          email: null,
          phone: null,
          status: 'new',
        },
        new Date('2025-01-17T11:00:00Z'),
      );

      await eventEmitter.emitAsync(LeadAddedEvent.eventName, event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const jobs = await commandQueue.getJobs(['waiting', 'active', 'completed']);
      expect(jobs).toHaveLength(0);
    });

    it('should generate unique command and message IDs for each event', async () => {
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const commandIds = jobs.map((job) => job.data.id as string);
      expect(commandIds[0]).not.toBe(commandIds[1]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const messageIds = jobs.map((job) => job.data.payload.id as string);
      expect(messageIds[0]).not.toBe(messageIds[1]);
    });
  });
});
