import { backendLogger as logger } from '@/server/logger'

export class TestResolver {
  async test(): Promise<String> {
    logger.info(`test apiVersion=1_0`)
    return 'test 1_0'
  }
}
