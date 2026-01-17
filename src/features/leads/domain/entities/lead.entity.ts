export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  REPLIED = 'replied',
  CONVERTED = 'converted',
  DEAD = 'dead',
}

export class Lead {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly status: LeadStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }): Omit<Lead, 'createdAt' | 'updatedAt'> {
    return {
      id: props.id,
      name: props.name,
      email: props.email ?? null,
      phone: props.phone ?? null,
      status: LeadStatus.NEW,
    };
  }
}
