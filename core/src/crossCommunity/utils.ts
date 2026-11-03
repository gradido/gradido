import { StatusMap } from 'elysia'

export function statusNumber(status?: number | keyof StatusMap): number {
  return typeof status === 'string' ? StatusMap[status] : (status ?? 200)
}
