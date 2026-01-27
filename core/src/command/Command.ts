export interface Command<T = any> {
  execute(): Promise<T>;
  validate?(): boolean;
}
