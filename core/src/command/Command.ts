export interface Command<T = any> {
  execute(): Promise<string | boolean | null | Error>;
  validate?(): boolean;
}
