export abstract class BaseError extends Error {
  protected constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EntityNotFoundError extends BaseError {
  constructor(id: string, type: string) {
    super(`Entity not found: ${id} - ${type}`);
    this.name = 'EntityNotFoundError';
  }
}
