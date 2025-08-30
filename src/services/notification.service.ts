type NotificationListener = (message: string) => void;

class NotificationService {
  private listeners: NotificationListener[] = [];

  subscribe(listener: NotificationListener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message: string) {
    this.listeners.forEach(listener => listener(message));
  }
}

export default new NotificationService();
