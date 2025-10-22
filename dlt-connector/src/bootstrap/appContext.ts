import { BackendClient } from '../client/backend/BackendClient'
import { HieroClient } from '../client/hiero/HieroClient'
import { GradidoNodeClient } from '../client/GradidoNode/GradidoNodeClient'
import { KeyPairCacheManager } from '../cache/KeyPairCacheManager'

export type AppContextClients = {
  backend: BackendClient
  hiero: HieroClient
  gradidoNode: GradidoNodeClient
}

export type AppContext = {
  cache: KeyPairCacheManager
  clients: AppContextClients
}

export function createAppContext(): AppContext {
  return {
    cache: KeyPairCacheManager.getInstance(),
    clients: {
      backend: BackendClient.getInstance(),
      hiero: HieroClient.getInstance(),
      gradidoNode: GradidoNodeClient.getInstance(),
    },
  }
}