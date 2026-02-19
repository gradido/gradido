export interface Command<_T = any> {
  execute(): Promise<string | boolean | null | Error>
  validate?(): boolean
}
