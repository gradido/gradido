import { Command } from './Command';

export abstract class BaseCommand<T = any> implements Command<T> {
  protected abstract requiredFields: string[];
  
  protected constructor(protected readonly params: any = {}) {
    this.validateRequiredFields();
  }

  abstract execute(): Promise<T>;
/*
  validate(): boolean {
    return true; // Default implementation, override in subclasses
  }

  protected validateParams(requiredParams: string[]): boolean {
    return requiredParams.every(param => this.params[param] !== undefined);
  }
*/
  private validateRequiredFields(): void {
    const missingFields = this.requiredFields.filter(field => 
      this.params[field] === undefined || this.params[field] === null || this.params[field] === ''
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for ${this.constructor.name}: ${missingFields.join(', ')}`);
    }
  }
 
  validate(): boolean {
    return this.requiredFields.every(field => 
      this.params[field] !== undefined && 
      this.params[field] !== null && 
      this.params[field] !== ''
    );
  }

}
