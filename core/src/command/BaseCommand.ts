import { getLogger } from 'log4js';
import { Command } from './Command';
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const';

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.command.BaseCommand.${method}`)

export abstract class BaseCommand<T = any> implements Command<T> {
  protected abstract requiredFields: string[];

  protected constructor(protected readonly params: any[]) {
    // this.validateRequiredFields();
  }

  abstract execute(): Promise<T>;

  private validateRequiredFields(): void {
    const methodLogger = createLogger(`validateRequiredFields`)
    if(!this.requiredFields || this.requiredFields.length === 0) {
      methodLogger.debug(`validateRequiredFields() no required fields`)
      return;
    }
    methodLogger.debug(`validateRequiredFields() requiredFields=${JSON.stringify(this.requiredFields)}`)
    const commandArgs = JSON.parse(this.params[0])
    /*
    const missingFields = this.requiredFields.filter(field => 
      commandArgs.{ field } === undefined || commandArgs.{ field } === null || commandArgs.{ field } === ''
    );
    methodLogger.debug(`validateRequiredFields() missingFields=${JSON.stringify(missingFields)}`)
    
    if (missingFields.length > 0) {
      methodLogger.error(`validateRequiredFields() missing fields: ${missingFields.join(', ')}`)
      throw new Error(`Missing required fields for ${this.constructor.name}: ${missingFields.join(', ')}`);
    }
    */
  }
 
  validate(): boolean {
    const methodLogger = createLogger(`validate`)
    methodLogger.debug(`validate() requiredFields=${JSON.stringify(this.requiredFields)} params=${JSON.stringify(this.params)}`)
    /*
    const isValid = this.requiredFields.every(field => 
      this.params[field] !== undefined && 
      this.params[field] !== null && 
      this.params[field] !== ''
    );
    methodLogger.debug(`validate() isValid=${isValid}`)
    */
    return true;
  }

}
