import {
  getChangedFields,
  updateAllDefinedAndChanged,
  updateIfDefinedAndChanged,
} from './updateField'

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
    type TestEntity = { field1: string | null; field2: string | null; field3: string | null }
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
    type TestEntity = { field1: string | null; field2: string | null }
    type TestInput = { field1: string | null }
    const current: TestEntity = { field1: 'current', field2: 'current' }
    const incoming: TestInput = { field1: null }
    const result = updateAllDefinedAndChanged(current, incoming)
    expect(result).toBe(true)
    expect(current).toEqual({ field1: null, field2: 'current' })
  })
})

describe('getChangedFields', () => {
  it('returns only the fields that differ from current', () => {
    const current = { field1: 'current', field2: 'current', field3: 'current' }
    const incoming = { field1: 'incoming', field2: 'current' }
    expect(getChangedFields(current, incoming)).toEqual({
      changed: true,
      value: { field1: 'incoming' },
    })
  })
  it('reports no change if all incoming fields are equal', () => {
    const current = { field1: 'current', field2: 2 }
    const incoming = { field1: 'current', field2: 2 }
    expect(getChangedFields(current, incoming)).toEqual({ changed: false })
  })
  it('reports no change for empty incoming', () => {
    expect(getChangedFields({ field1: 'current' }, {})).toEqual({ changed: false })
  })
  it('compares buffers by content, not by reference', () => {
    const current = { key: Buffer.from('same') }
    expect(getChangedFields(current, { key: Buffer.from('same') })).toEqual({ changed: false })
  })
  it('detects changed buffer content', () => {
    const current = { key: Buffer.from('current') }
    const incoming = { key: Buffer.from('incoming') }
    expect(getChangedFields(current, incoming)).toEqual({
      changed: true,
      value: { key: Buffer.from('incoming') },
    })
  })
  it('detects a change from null to a value', () => {
    const current: { field: string | null } = { field: null }
    expect(getChangedFields(current, { field: 'incoming' })).toEqual({
      changed: true,
      value: { field: 'incoming' },
    })
  })
  it('does not modify current', () => {
    const current = { field: 'current' }
    getChangedFields(current, { field: 'incoming' })
    expect(current).toEqual({ field: 'current' })
  })
})
