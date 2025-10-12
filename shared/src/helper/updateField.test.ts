import { updateAllDefinedAndChanged, updateIfDefinedAndChanged } from './updateField'

describe('updateIfDefinedAndChanged', () => {
  it('should update field if incoming is different from current', () => {
    const current = { field: 'current' }
    const incoming = 'incoming'
    const result = updateIfDefinedAndChanged(current, 'field', incoming)
    expect(result).toBe(true)
    expect(current.field).toBe('incoming')
  })
  it('should not update field if incoming is the same as current', () => {
    const current = { field: 'current' }
    const incoming = 'current'
    const result = updateIfDefinedAndChanged(current, 'field', incoming)
    expect(result).toBe(false)
    expect(current.field).toBe('current')
  })
  it('should not update field if incoming is undefined', () => {
    const current = { field: 'current' }
    const incoming = undefined
    const result = updateIfDefinedAndChanged(current, 'field', incoming)
    expect(result).toBe(false)
    expect(current.field).toBe('current')
  })
  it('should update field if incoming is null', () => {
    type TestEntity = { field: string | null }
    const current: TestEntity = { field: 'current' }
    const incoming = null
    const result = updateIfDefinedAndChanged(current, 'field', incoming)
    expect(result).toBe(true)
    expect(current.field).toBe(null)
  })
})

describe('updateAllDefinedAndChanged', () => {
  it('should update all fields if incoming is different from current', () => {
    type TestEntity = { field1: string | null, field2: string | null, field3: string | null }
    const current: TestEntity = { field1: 'current', field2: 'current', field3: 'current' }
    const incoming = { field1: 'incoming', field2: 'incoming', otherField: 'incoming' }
    const result = updateAllDefinedAndChanged(current, incoming)
    expect(result).toBe(true)
    expect(current).toEqual({ field1: 'incoming', field2: 'incoming', field3: 'current' })
  })
  it('should not update any field if incoming is the same as current', () => {
    const current = { field1: 'current', field2: 'current' }
    const incoming = { field1: 'current', field2: 'current' }
    const result = updateAllDefinedAndChanged(current, incoming)
    expect(result).toBe(false)
    expect(current).toEqual({ field1: 'current', field2: 'current' })
  })
  it('should not update any field if incoming is undefined', () => {
    const current = { field1: 'current', field2: 'current' }
    const incoming = { field1: undefined, field2: undefined }
    const result = updateAllDefinedAndChanged(current, incoming)
    expect(result).toBe(false)
    expect(current).toEqual({ field1: 'current', field2: 'current' })
  })
  it('should update field if incoming is null', () => {
    type TestEntity = { field1: string | null, field2: string | null }
    type TestInput = { field1: string | null }
    const current: TestEntity = { field1: 'current', field2: 'current' }
    const incoming: TestInput = { field1: null }
    const result = updateAllDefinedAndChanged(current, incoming)
    expect(result).toBe(true)
    expect(current).toEqual({ field1: null, field2: 'current' })
  })
})
  
