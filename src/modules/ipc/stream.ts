import { StringUtils } from '../../utils';

export class IPCStream {
  static composeChannels(base: string, eventId: string) {
    const data = `${base}-${eventId}-data`;
    const error = `${base}-${eventId}-error`;
    const complete = `${base}-${eventId}-complete`;
    const abort = `${base}-${eventId}-abort`;

    return {
      data,
      error,
      complete,
      abort,
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
