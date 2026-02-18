export interface Command<T = any> {
  execute(): Promise<Record<string, unknown> | boolean | null | Error>;
  validate?(): boolean;
}
