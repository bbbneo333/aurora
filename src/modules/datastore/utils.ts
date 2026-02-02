import { v4 as uuidv4 } from 'uuid';

export class DatastoreUtils {
  static generateId(): string {
    return uuidv4();
  }
}
