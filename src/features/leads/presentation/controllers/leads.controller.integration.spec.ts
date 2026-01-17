import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigModule } from '@nestjs/config';
import { LeadsModule } from '../../leads.module';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { CreateLeadDto } from '../../application/dtos/create-lead.dto';
import { LeadResponseDto } from '../../application/dtos/lead-response.dto';
import { FakeUuidGenerator, UuidGenerator } from '@/shared/infrastructure/uuid';
import { App } from 'supertest/types';

interface ValidationErrorResponse {
  statusCode: number;
  message: string[];
  error: string;
}

describe('LeadsController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let fakeUuidGenerator: FakeUuidGenerator;
  let requestAgent: App;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    fakeUuidGenerator = new FakeUuidGenerator();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              DATABASE_URL: container.getConnectionUri(),
            }),
          ],
        }),
        DatabaseModule,
        LeadsModule,
      ],
    })
      .overrideProvider(UuidGenerator)
      .useValue(fakeUuidGenerator)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    pool = moduleFixture.get<Pool>(Pool);
    requestAgent = app.getHttpServer() as unknown as App;

    const migrationPath = path.join(
      __dirname,
      '../../../../../supabase/migrations/20260117000001_create_leads_table.sql',
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(migrationSql);
  }, 60000);

  afterEach(async () => {
    await pool.query('TRUNCATE TABLE leads CASCADE');
    fakeUuidGenerator.reset();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('POST /lead', () => {
    it('should create a lead with name and email', async () => {
      const createLeadDto: CreateLeadDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = await request(requestAgent).post('/lead').send(createLeadDto);
      expect(response.status).toBe(201);

      const body = response.body as LeadResponseDto;
      expect(body.id).toBe('00000000-0000-0000-0000-000000000000');
      expect(body.name).toBe('John Doe');
      expect(body.email).toBe('john@example.com');
      expect(body.status).toBe('new');
      expect(body.createdAt).toBeDefined();
    });

    it('should create a lead with name and phone', async () => {
      const createLeadDto = {
        name: 'Jane Doe',
        phone: '+1234567890',
      };

      const response = await request(requestAgent).post('/lead').send(createLeadDto);
      expect(response.status).toBe(201);

      const body = response.body as LeadResponseDto;
      expect(body.id).toBe('00000000-0000-0000-0000-000000000000');
      expect(body.name).toBe('Jane Doe');
      expect(body.phone).toBe('+1234567890');
      expect(body.status).toBe('new');
    });

    it('should create a lead with name, email and phone', async () => {
      const createLeadDto = {
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1987654321',
      };

      const response = await request(requestAgent).post('/lead').send(createLeadDto);

      expect(response.status).toBe(201);
      const body = response.body as LeadResponseDto;
      expect(body.id).toBe('00000000-0000-0000-0000-000000000000');
      expect(body.name).toBe('Bob Smith');
      expect(body.email).toBe('bob@example.com');
      expect(body.phone).toBe('+1987654321');
      expect(body.status).toBe('new');
    });

    it('should return 400 when name is missing', async () => {
      const createLeadDto = {
        email: 'john@example.com',
      };

      const response = await request(requestAgent).post('/lead').send(createLeadDto);

      expect(response.status).toBe(400);
      const body = response.body as ValidationErrorResponse;
      expect(body.message).toContain('name should not be empty');
    });

    it('should return 400 when neither email nor phone is provided', async () => {
      const createLeadDto = {
        name: 'John Doe',
      };

      const response = await request(requestAgent).post('/lead').send(createLeadDto);

      expect(response.status).toBe(400);
      const body = response.body as ValidationErrorResponse;
      expect(body.message).toContain('Either email or phone must be provided');
    });

    it('should return 400 when email format is invalid', async () => {
      const createLeadDto = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      const response = await request(requestAgent).post('/lead').send(createLeadDto);

      expect(response.status).toBe(400);
      const body = response.body as ValidationErrorResponse;
      expect(body.message).toContain('email must be an email');
    });
  });
});
