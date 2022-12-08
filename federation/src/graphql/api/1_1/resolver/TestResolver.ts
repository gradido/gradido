import { backendLogger as logger } from '@/server/logger'

export class TestResolver {
  async test(): Promise<String> {
    logger.info(`test apiVersion=1_1`)
    return 'test 1_1'
  }
}
