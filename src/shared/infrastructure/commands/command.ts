export abstract class Command<T = unknown> {
  abstract readonly name: string;

  constructor(
    public readonly id: string,
    public readonly correlationIds: Record<string, string>,
    public readonly payload: T,
    public readonly createdAt: Date = new Date(),
  ) {}
}
