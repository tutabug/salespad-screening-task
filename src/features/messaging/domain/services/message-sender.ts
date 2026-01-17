import { MessageChannel, ChannelMessageMap } from '@/shared/domain';

export abstract class MessageSender<TChannel extends MessageChannel = MessageChannel> {
  abstract readonly channel: TChannel;
  abstract send(channelMessage: ChannelMessageMap[TChannel]): Promise<void>;
}
