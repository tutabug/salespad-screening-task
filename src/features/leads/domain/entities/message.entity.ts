import { MessageChannel } from '../value-objects/message-channel';

export interface EmailChannelMessage {
  to: string;
  subject: string;
  body: string;
}

export interface WhatsAppChannelMessage {
  to: string;
  text: string;
}

export interface LinkedInChannelMessage {
  profileUrl: string;
  text: string;
}

export interface VoiceChannelMessage {
  to: string;
  script: string;
}

export interface AdsChannelMessage {
  targetAudience: string;
  headline: string;
  description: string;
}

export type ChannelMessageMap = {
  [MessageChannel.EMAIL]: EmailChannelMessage;
  [MessageChannel.WHATSAPP]: WhatsAppChannelMessage;
  [MessageChannel.LINKEDIN]: LinkedInChannelMessage;
  [MessageChannel.VOICE]: VoiceChannelMessage;
  [MessageChannel.ADS]: AdsChannelMessage;
};

export class Message<TChannel extends MessageChannel = MessageChannel> {
  constructor(
    public readonly id: string,
    public readonly channel: TChannel,
    public readonly channelMessage: ChannelMessageMap[TChannel],
    public readonly createdAt: Date = new Date(),
  ) {}
}
