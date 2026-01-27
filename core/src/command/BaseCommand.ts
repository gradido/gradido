import { Command } from './Command';

export abstract class BaseCommand<T = any> implements Command<T> {
  protected constructor(protected readonly params: any = {}) {}

  abstract execute(): Promise<T>;

  validate(): boolean {
    return true; // Default implementation, override in subclasses
  }

  protected validateParams(requiredParams: string[]): boolean {
    return requiredParams.every(param => this.params[param] !== undefined);
  }
}
