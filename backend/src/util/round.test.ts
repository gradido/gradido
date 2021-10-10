import { roundCeilFrom4, roundFloorFrom4, roundCeilFrom2, roundFloorFrom2 } from './round'

describe('utils/round', () => {
  it('roundCeilFrom4', () => {
    const amount = 11617
    expect(roundCeilFrom4(amount)).toBe(1.17)
  })
  // Not sure if the following skiped tests make sence!?
  it('roundFloorFrom4', () => {
    const amount = 11617
    expect(roundFloorFrom4(amount)).toBe(1.16)
  })
  it('roundCeilFrom2', () => {
    const amount = 1216
    expect(roundCeilFrom2(amount)).toBe(13)
  })
  // not possible, nodejs hasn't enough accuracy
  it('roundFloorFrom2', () => {
    const amount = 1216
    expect(roundFloorFrom2(amount)).toBe(12)
  })
})
