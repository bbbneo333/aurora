type NotificationListener = (message: string) => void;

export class NotificationService {
  private static listeners: NotificationListener[] = [];

  static subscribe(listener: NotificationListener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static showMessage(message: string) {
    this.listeners.forEach(listener => listener(message));
  }
}
