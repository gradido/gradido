// core/src/command/commands/ExampleCommand.ts
/*
import { BaseCommand } from '../BaseCommand';
import { CommandRegistry } from '../CommandRegistry';

export interface ExampleCommandParams {
  someData: string;
}

export class ExampleCommand extends BaseCommand<{ processed: boolean }> {
  constructor(params: ExampleCommandParams) {
    super('EXAMPLE_COMMAND', params);
  }

  validate(): boolean {
    return !!this.params.someData;
  }

  async execute(): Promise<{ processed: boolean }> {
    // Command implementation here
    console.log('Executing ExampleCommand with data:', this.params.someData);
    return { processed: true };
  }
}

// Register the command
CommandRegistry.registerCommand('EXAMPLE_COMMAND', ExampleCommand);
*/