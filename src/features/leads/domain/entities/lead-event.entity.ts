export enum LeadEventType {
  LEAD_ADDED = 'lead_added',
  MESSAGE_SENT = 'message_sent',
  REPLY_RECEIVED = 'reply_received',
  AI_REPLY_SENT = 'ai_reply_sent',
  STATUS_CHANGED = 'status_changed',
}

export class LeadEvent<T> {
  constructor(
    public readonly id: string,
    public readonly type: LeadEventType,
    public readonly leadId: string,
    public readonly correlationIds: Record<string, string>,
    public readonly payload: T,
    public readonly createdAt: Date,
  ) {}

  static create<T>(props: {
    id: string;
    type: LeadEventType;
    leadId: string;
    correlationIds: Record<string, string>;
    payload: T;
  }): Omit<LeadEvent<T>, 'createdAt'> {
    return {
      id: props.id,
      type: props.type,
      leadId: props.leadId,
      correlationIds: props.correlationIds,
      payload: props.payload,
    };
  }
}
