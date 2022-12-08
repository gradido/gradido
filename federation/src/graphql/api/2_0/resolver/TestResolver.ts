import { backendLogger as logger } from '@/server/logger'

export class TestResolver {
  async test(): Promise<String> {
    logger.info(`test apiVersion=2_0`)
    return 'test 2_0'
  }
}
