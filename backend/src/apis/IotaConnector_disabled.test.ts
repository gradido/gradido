import { IotaClientSingleton } from '@/apis/IotaConnector'
import { CONFIG } from '@/config'
import { backendLogger as logger } from '@/server/logger'
/*
jest.mock('@/config', () => ({
  CONFIG: { IOTA: true, IOTA_API_URL:'invalidUrl' },
}))
*/

describe('apis/IotaConnector/disabled', () => {
  beforeEach(() => {
    CONFIG.IOTA = false
  })
  it('getInstance return undefined if iota is disabled', () => {
    const spyLog = jest.spyOn(logger, 'info')
    expect(IotaClientSingleton.getInstance()).toBeUndefined()
    expect(spyLog).toHaveBeenCalledWith('Iota are disabled via config...');
  })
})

describe('apis/IotaConnector/invalidIotaUrl', () => {
  beforeEach(() => {
    CONFIG.IOTA = true
    CONFIG.IOTA_API_URL = 'invalidUrl'
  })
  it('log "couldn\'t connect to iota"', () => {
    const spyLog = jest.spyOn(logger, 'error')
    expect(IotaClientSingleton.getInstance()).toBeUndefined()
    expect(spyLog).toHaveBeenCalledWith('couldn\'t connect to iota')
  })
})
