import { v4 as uuidv4 } from 'uuid';

export class DatastoreUtils {
  static generateId(): string {
    return uuidv4();
  }

  static composeId(...parts: string[]): string {
    return parts.join('-');
  }
}
