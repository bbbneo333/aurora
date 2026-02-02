import { StringUtils } from '../../utils';

export class IPCStream {
  static composeChannels(base: string, eventId: string) {
    const data = `${base}-${eventId}-data`;
    const error = `${base}-${eventId}-error`;
    const complete = `${base}-${eventId}-complete`;

    return {
      data,
      error,
      complete,
    };
  }

  static createChannels(base: string) {
    const eventId = StringUtils.generateId();

    return {
      eventId,
      ...this.composeChannels(base, eventId),
    };
  }
}
