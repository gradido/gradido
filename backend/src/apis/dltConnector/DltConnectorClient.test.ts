import { CONFIG } from '@/config'

import { DltConnectorClient } from './DltConnectorClient'

describe('undefined DltConnectorClient', () => {
  it('invalid url', () => {
    CONFIG.DLT_CONNECTOR_URL = ''
    CONFIG.DLT_CONNECTOR = true
    const result = DltConnectorClient.getInstance()
    expect(result).toBeUndefined()
    CONFIG.DLT_CONNECTOR_URL = 'http://dlt-connector:6010'
  })

  it('DLT_CONNECTOR is false', () => {
    CONFIG.DLT_CONNECTOR = false
    const result = DltConnectorClient.getInstance()
    expect(result).toBeUndefined()
    CONFIG.DLT_CONNECTOR = true
  })
})


