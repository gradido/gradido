import { Command } from "./Command";

export interface ICommandConstructor<T = any> {
  new (params: any): Command<T>;
}