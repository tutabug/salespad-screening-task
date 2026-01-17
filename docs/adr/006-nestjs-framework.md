# ADR-006: NestJS as Application Framework

## Status
Accepted

## Context
We need to choose a Node.js framework for building a REST API that demonstrates:
- Clean Architecture principles
- Modularity and feature isolation
- Testability with dependency injection
- Type safety with TypeScript
- Production-ready patterns

Options considered:
1. **NestJS** - Opinionated, Angular-inspired framework with built-in DI
2. **Express.js** - Minimal, unopinionated web framework
3. **Fastify** - Performance-focused framework
4. **Koa** - Lightweight middleware framework

## Decision
We will use **NestJS** as the application framework.

NestJS provides:
- First-class TypeScript support
- Built-in dependency injection container
- Modular architecture with `@Module()` decorators
- Decorator-based routing and validation
- Rich ecosystem of official packages (`@nestjs/*`)

## Consequences

### Positive

#### Modularity
NestJS modules align perfectly with vertical slice architecture:
```typescript
@Module({
  imports: [BullModule.registerQueue({ name: COMMAND_QUEUE_NAME })],
  controllers: [LeadsController],
  providers: [
    AddLeadUseCase,
    ReplyToLeadUseCase,
    { provide: LeadRepository, useClass: PrismaLeadRepository },
    { provide: GetLeadDetailsQuery, useClass: PrismaGetLeadDetailsQuery },
  ],
})
export class LeadsModule {}
```
Each feature is encapsulated in its own module with explicit dependencies.

#### Dependency Injection
The built-in DI container enables Clean Architecture's dependency inversion:
```typescript
// Abstract class as injection token
export abstract class LeadRepository {
  abstract addLead(input: AddLeadInput): Promise<{ lead: Lead; event: LeadAddedEvent }>;
}

// Infrastructure implementation
@Injectable()
export class PrismaLeadRepository extends LeadRepository { ... }

// Use case depends on abstraction
@Injectable()
export class AddLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}
}
```
No need for manual wiring or service locators.

#### Decorator-Based Design
Reduces boilerplate and improves readability:
```typescript
@Controller('leads')
export class LeadsController {
  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async create(@Body() dto: CreateLeadDto): Promise<LeadResponseDto> {
    return this.createLeadUseCase.execute(dto);
  }
}
```

#### Testing Support
- Easy to mock dependencies via DI
- `@nestjs/testing` provides `TestingModule` for integration tests
- Test containers integration for database tests

```typescript
const module = await Test.createTestingModule({
  providers: [
    AddLeadUseCase,
    { provide: LeadRepository, useClass: FakeLeadRepository },
  ],
}).compile();
```

#### Rich Ecosystem
Official packages for common needs:
- `@nestjs/config` - Configuration management
- `@nestjs/swagger` - OpenAPI documentation
- `@nestjs/bullmq` - Queue processing
- `@nestjs/event-emitter` - Domain events
- `nestjs-prisma` - Prisma integration

### Negative
- **Learning curve**: Decorators and DI concepts require familiarity
- **Opinionated**: Less flexibility than Express for unconventional patterns
- **Bundle size**: Larger than minimal frameworks
- **Magic**: Decorators can obscure what's happening under the hood

## Alternatives Considered

### Express.js
**Rejected because**:
- No built-in DI - requires manual setup (InversifyJS, tsyringe)
- No module system - harder to organize large codebases
- More boilerplate for common patterns (validation, serialization)

### Fastify
**Considered for**: Raw performance advantage
**Rejected because**:
- Less mature ecosystem
- NestJS can use Fastify as underlying platform if needed
- Performance difference negligible for this use case

### Koa
**Rejected because**:
- Minimal feature set requires many additions
- No TypeScript-first design
- Smaller ecosystem than NestJS
