// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import {
  coordinatesComplete,
  coordinatesLine,
  parseCoordinate,
  splitCoordinates,
} from './Coordinates.logic'

describe('parseCoordinate', () => {
  it('reads the number at the start, as parseFloat does', () => {
    expect(parseCoordinate('52.')).toBe(52)
    expect(parseCoordinate('-0.5x')).toBe(-0.5)
  })

  it('reads nothing as none', () => {
    expect(parseCoordinate('')).toBe('')
    expect(parseCoordinate('north')).toBe('')
  })
})

describe('coordinatesLine', () => {
  it('writes the pair as one line', () => {
    expect(coordinatesLine(49.28, 9.74)).toBe('49.28, 9.74')
  })

  it('takes 0 as a coordinate', () => {
    expect(coordinatesLine(51.48, 0)).toBe('51.48, 0')
  })

  it('writes nothing where one is missing', () => {
    expect(coordinatesLine(49.28, '')).toBe('')
  })
})

describe('splitCoordinates', () => {
  it('splits a pasted pair', () => {
    expect(splitCoordinates(' 52.52 , 13.405 ')).toEqual({ latitude: 52.52, longitude: 13.405 })
  })

  it('splits nothing that is no pair of numbers', () => {
    expect(splitCoordinates('52.52')).toBeNull()
    expect(splitCoordinates('52.52, east')).toBeNull()
    expect(splitCoordinates('1, 2, 3')).toBeNull()
  })
})

describe('coordinatesComplete', () => {
  it('takes both or none', () => {
    expect(coordinatesComplete(1, 2)).toBe(true)
    expect(coordinatesComplete('', '')).toBe(true)
  })

  it('not one alone', () => {
    expect(coordinatesComplete(1, '')).toBe(false)
    expect(coordinatesComplete('', 2)).toBe(false)
  })
})
