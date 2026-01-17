# Copilot Instructions

## Project Overview

This is a **SalesPad Tech Lead Screening Task** - a NestJS API implementation demonstrating clean architecture principles.

## Architecture Overview

This project follows **Vertical Slice Architecture** with **Clean Architecture** within each slice:

```
src/
  features/
    <feature-name>/
      domain/           # Pure business entities and repository interfaces
      application/      # Use cases and DTOs
      infrastructure/   # Mongoose schemas and repository implementations
      presentation/     # HTTP controllers
      <feature>.module.ts    # Feature module (self-contained)
  
  shared/
    infrastructure/
      database/         # Shared MongoDB connection
```

### Key Principles
- **Vertical Slices**: Each feature is self-contained with its own Clean Architecture layers
- **Clean Architecture within Slices**: Dependency rules flow inward (Presentation → Application → Domain)
- **Shared Infrastructure**: Cross-cutting concerns (database connection) live in `shared/`
- **No Cross-Feature Dependencies**: Features cannot import from each other
- **Domain Independence**: Domain layer has no external dependencies

## Project Conventions

### Package Manager
- **Always use `pnpm`** for dependency management
- Commands: `pnpm install`, `pnpm add`, `pnpm remove`
- Never use `npm` or `yarn`

### File Organization
- **Vertical Slices**: Each feature in `src/features/<feature-name>/`
- **Clean Architecture Layers** within each feature:
  - `domain/` - Entities and repository interfaces
  - `application/` - Use cases and DTOs
  - `infrastructure/` - Schemas and repository implementations
  - `presentation/` - Controllers and API layer
- **Tests Side-by-Side** with source files:
  - Unit tests: `*.spec.ts` (e.g., `entity.spec.ts`)
  - Integration tests: `*.integration.spec.ts` (e.g., `controller.integration.spec.ts`)
- **Shared Concerns**: Cross-cutting infrastructure in `src/shared/`
  - `infrastructure/` - Database module, external services
  - `config/` - Environment validation schemas

### Dependency Injection Pattern
Use **abstract classes** instead of interfaces for types that need to be injected:
```typescript
// domain/repositories/example.repository.ts
export abstract class ExampleRepository {
  abstract save(entity: Example): Promise<Example>;
  abstract findById(id: string): Promise<Example | null>;
}

// Inject directly using the abstract class
constructor(private readonly repository: ExampleRepository) {}

// Provide in module
providers: [
  {
    provide: ExampleRepository,
    useClass: MongooseExampleRepository,
  },
]
```

**Why abstract classes?** NestJS can use them as injection tokens directly, eliminating the need for Symbol tokens and reducing boilerplate.

### DTO Validation
All DTOs use `class-validator` decorators AND `@ApiProperty` for Swagger:
```typescript
@ApiProperty({ description: '...', example: '...' })
@IsString()
@IsNotEmpty()
title: string;
```

### Swagger Documentation
- Tag controllers with `@ApiTags('resource-name')`
- Document all endpoints with `@ApiOperation`, `@ApiResponse`, `@ApiBody`
- Include success (201/200) and error responses (400, 404, etc.)

## Development Workflows

### Adding a New Feature
1. Create feature directory in `src/features/<feature-name>/`
2. Create domain layer:
   - Entities in `domain/entities/`
   - Repository interfaces in `domain/repositories/` (use abstract classes)
3. Create application layer:
   - DTOs in `application/dtos/` with validation decorators
   - Use cases in `application/use-cases/`
4. Create infrastructure layer:
   - Mongoose schemas in `infrastructure/schemas/`
   - Repository implementations in `infrastructure/repositories/`
5. Create presentation layer:
   - Controllers in `presentation/controllers/`
6. Create feature module `<feature-name>.module.ts` that wires everything together
7. Import feature module in `app.module.ts`
8. Write unit tests (`.spec.ts`) and integration tests (`.integration.spec.ts`)

### Running Tests
- **Unit tests**: `pnpm test` - Fast, mocked dependencies
- **Integration tests**: `pnpm run test:integration` - Uses Testcontainers for real database instances

### Integration Test Pattern
Each integration test:
1. Spins up required services via Testcontainers in `beforeAll`
2. Initializes clean NestJS app in `beforeEach`
3. **Cleans database** in `afterEach` - ensures test isolation
4. Stops containers in `afterAll`

Example database cleanup:
```typescript
afterEach(async () => {
  // Clean all data from database to ensure test isolation
  // Implementation depends on database technology used
  await app.close();
});
```

### Docker Commands
- Local dev with hot reload: `docker-compose up`
- Database runs on port configured in docker-compose
- App runs on port 3000, Swagger at http://localhost:3000/api

## Database Patterns

### Schema Definition
Use `@nestjs/mongoose` decorators:
```typescript
@Schema()
export class EntityDocument extends Document {
  @Prop({ required: true })
  property: string;
}
```

### Repository Implementation
Map between Mongoose documents and domain entities:
```typescript
private toDomain(document: EntityDocument): Entity {
  return new Entity(document._id.toString(), document.property, ...);
}
```

## Code Quality

- **ESLint + Prettier** configured - run `pnpm run lint` and `pnpm run format`
- Use path alias `@/` for imports: `import { Task } from '@/domain/entities/task.entity'`
- TypeScript strict mode disabled for NestJS compatibility, but write type-safe code
- **pnpm** used instead of npm for faster, more efficient dependency management
- **No comments** - Code should be self-documenting. Do not add comments when generating code

### Cyclomatic Complexity Rule
**Keep cyclomatic complexity ≤ 7 per method/function** (from "Code That Fits in Your Head" by Mark Seemann)

- **Why?** Human short-term memory can hold ~7 items. Code with complexity ≤ 7 fits in your head
- **How?** Extract private methods when complexity exceeds 7
- **Naming:** Use verb-based names for extracted methods (e.g., `validateInput()`, `processChunk()`, `buildResponse()`)
- **Single Responsibility:** Each method should do one thing well
- **Readability:** Main method should read like a book's table of contents

Example of refactoring high complexity:
```typescript
// ❌ Bad: Cyclomatic complexity = 15
async execute(input: Input): Promise<Output> {
  if (!input.id) throw new Error('Missing id');
  const data = await this.repo.find(input.id);
  if (!data) throw new Error('Not found');
  if (data.status === 'completed') return this.buildResponse(data);
  if (data.status === 'failed') await this.retry(data);
  // ... more conditions and logic
}

// ✅ Good: Complexity = 3, extracted methods have complexity ≤ 7
async execute(input: Input): Promise<Output> {
  this.validateInput(input);
  const data = await this.findData(input.id);
  return await this.processData(data);
}

private validateInput(input: Input): void {
  if (!input.id) throw new Error('Missing id');
}

private async findData(id: string): Promise<Data> {
  const data = await this.repo.find(id);
  if (!data) throw new Error('Not found');
  return data;
}

private async processData(data: Data): Promise<Output> {
  if (data.status === 'completed') return this.buildResponse(data);
  if (data.status === 'failed') await this.retry(data);
  return this.handlePending(data);
}
```

## Common Patterns

### Global Validation Pipe
Already configured in `main.ts`:
- `whitelist: true` - strips unknown properties
- `forbidNonWhitelisted: true` - throws error on extra properties
- `transform: true` - auto-transforms payloads to DTO instances

### Module Wiring
Each feature module is self-contained and registers its own schemas:
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntityDocument.name, schema: EntitySchema }
    ])
  ],
  controllers: [EntityController],
  providers: [
    CreateEntityUseCase,
    {
      provide: EntityRepository,
      useClass: MongooseEntityRepository,
    },
  ],
})
export class EntityModule {}
```

Shared database connection is in `DatabaseModule` (imported in `AppModule`).

## When Adding New Dependencies
Always use `pnpm` to install packages and types if needed:
```bash
pnpm add <package>
pnpm add -D @types/<package>
```
