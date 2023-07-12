import { IotaClientSingleton } from '@/client/IotaClientSingleton'
import CONFIG from '@/config'
import { logger } from '@/server/logger'

describe('apis/IotaClientSingleton/disabled', () => {
  beforeEach(() => {
    CONFIG.IOTA = false
  })
  it('getInstance return undefined if iota is disabled', () => {
    const spyLog = jest.spyOn(logger, 'info')
    expect(IotaClientSingleton.getInstance()).toBeUndefined()
    expect(spyLog).toHaveBeenCalledWith('Iota are disabled via config...')
  })
})

describe('apis/IotaClientSingleton/invalidIotaUrl', () => {
  beforeEach(() => {
    CONFIG.IOTA = true
    CONFIG.IOTA_API_URL = 'invalidUrl'
  })
  it('log "couldn\'t connect to iota"', () => {
    const spyLog = jest.spyOn(logger, 'error')
    expect(IotaClientSingleton.getInstance()).toBeUndefined()
    expect(spyLog).toHaveBeenCalledWith("couldn't connect to iota")
  })
})
